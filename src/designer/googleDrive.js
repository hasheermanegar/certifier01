import { createImportedTemplates } from "./customTemplates";

const DRIVE_API = "https://www.googleapis.com/drive/v3/files";
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const PICKER_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.google-apps.presentation",
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.drawing"
].join(",");

let pickerPromise;
const scriptPromises = new Map();

export function getGoogleDriveConfig() {
  return {
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY?.trim() || "",
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "",
    appId: import.meta.env.VITE_GOOGLE_APP_ID?.trim() || ""
  };
}

export function getGoogleDriveSetupMessage({ picker = false } = {}) {
  const config = getGoogleDriveConfig();
  const missing = [
    !config.apiKey && "VITE_GOOGLE_API_KEY",
    picker && !config.clientId && "VITE_GOOGLE_CLIENT_ID",
    picker && !config.appId && "VITE_GOOGLE_APP_ID"
  ].filter(Boolean);
  const feature = picker ? "the Google Drive Picker" : "public Drive link import";
  return missing.length ? `Configure ${missing.join(", ")} to enable ${feature}.` : "";
}

function loadScript(id, source) {
  if (scriptPromises.has(id)) return scriptPromises.get(id);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.src = source;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      script.remove();
      reject(new Error("Could not load Google Drive import support."));
    };
    document.head.appendChild(script);
  }).catch(error => {
    scriptPromises.delete(id);
    throw error;
  });
  scriptPromises.set(id, promise);
  return promise;
}

export async function preloadGoogleDrivePicker() {
  const setupMessage = getGoogleDriveSetupMessage({ picker: true });
  if (setupMessage) throw new Error(setupMessage);
  if (window.google?.picker && window.google?.accounts?.oauth2) return;
  if (!pickerPromise) {
    pickerPromise = Promise.all([
      loadScript("google-api-client", "https://apis.google.com/js/api.js"),
      loadScript("google-identity-services", "https://accounts.google.com/gsi/client")
    ]).then(() => new Promise((resolve, reject) => {
      if (!window.gapi?.load) {
        reject(new Error("Google Drive import support did not initialize."));
        return;
      }
      window.gapi.load("picker", {
        callback: resolve,
        onerror: () => reject(new Error("Could not initialize the Google Drive Picker.")),
        ontimeout: () => reject(new Error("Google Drive Picker initialization timed out.")),
        timeout: 10000
      });
    })).catch(error => {
      pickerPromise = null;
      throw error;
    });
  }
  await pickerPromise;
}

function requestDriveToken(clientId) {
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: response => {
        if (response.error) {
          reject(new Error(response.error_description || "Google Drive authorization failed."));
        } else if (!response.access_token) {
          reject(new Error("Google did not return a Drive access token."));
        } else {
          resolve(response.access_token);
        }
      },
      error_callback: error => reject(new Error(error.message || "Google sign-in could not be opened."))
    });
    tokenClient.requestAccessToken({ prompt: "" });
  });
}

export async function pickGoogleDriveFiles() {
  const setupMessage = getGoogleDriveSetupMessage({ picker: true });
  if (setupMessage) throw new Error(setupMessage);
  await preloadGoogleDrivePicker();
  const { apiKey, clientId, appId } = getGoogleDriveConfig();
  const accessToken = await requestDriveToken(clientId);

  const files = await new Promise((resolve, reject) => {
    try {
      const google = window.google;
      const picker = new google.picker.PickerBuilder()
        .setAppId(appId)
        .setDeveloperKey(apiKey)
        .setOAuthToken(accessToken)
        .setOrigin(window.location.protocol + "//" + window.location.host)
        .setTitle("Choose template files")
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .addView(new google.picker.DocsView(google.picker.ViewId.DOCS).setMimeTypes(PICKER_MIME_TYPES))
        .setCallback(data => {
          if (data.action === google.picker.Action.PICKED) {
            resolve(data.docs || []);
          } else if (data.action === google.picker.Action.CANCEL) {
            resolve([]);
          }
        })
        .build();
      picker.setVisible(true);
    } catch (error) {
      reject(error);
    }
  });

  return { files, accessToken };
}

function driveApiUrl(fileId, params = {}) {
  const url = new URL(`${DRIVE_API}/${encodeURIComponent(fileId)}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

function driveHeaders(accessToken, fileId, resourceKey) {
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (resourceKey) headers["X-Goog-Drive-Resource-Keys"] = `${fileId}/${resourceKey}`;
  return headers;
}

async function responseError(response, fallback) {
  const data = await response.json().catch(() => null);
  return new Error(data?.error?.message || fallback);
}

function fileDetails(metadata) {
  const googleMimeTypes = {
    "application/vnd.google-apps.presentation": "application/pdf",
    "application/vnd.google-apps.document": "application/pdf",
    "application/vnd.google-apps.drawing": "application/pdf"
  };
  const mimeType = googleMimeTypes[metadata.mimeType] || metadata.mimeType;
  const baseName = metadata.name || "Drive template";
  const name = googleMimeTypes[metadata.mimeType]
    ? `${baseName.replace(/\.[^.]+$/, "")}.pdf`
    : baseName;
  const supported = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ].includes(mimeType);
  if (!supported) {
    throw new Error("Choose a PDF, PPTX, PNG, JPG or WebP file from Drive.");
  }
  const size = Number(metadata.size);
  if (Number.isFinite(size) && size > MAX_FILE_SIZE) {
    throw new Error("Choose a Drive file smaller than 25 MB.");
  }
  return { mimeType, name, exportGoogleDoc: !!googleMimeTypes[metadata.mimeType] };
}

async function downloadDriveFile(metadata, { apiKey = "", accessToken = "", resourceKey = "" } = {}) {
  const details = fileDetails(metadata);
  const params = details.exportGoogleDoc
    ? { mimeType: "application/pdf", supportsAllDrives: "true" }
    : { alt: "media", supportsAllDrives: "true" };
  if (apiKey) params.key = apiKey;
  const endpoint = details.exportGoogleDoc
    ? `${DRIVE_API}/${encodeURIComponent(metadata.id)}/export`
    : `${DRIVE_API}/${encodeURIComponent(metadata.id)}`;
  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    headers: driveHeaders(accessToken, metadata.id, resourceKey || metadata.resourceKey)
  });
  if (!response.ok) {
    throw await responseError(response, "Could not download that Google Drive file.");
  }
  const blob = await response.blob();
  if (blob.size > MAX_FILE_SIZE) throw new Error("Choose a Drive file smaller than 25 MB.");
  if (!blob.size) throw new Error("The selected Google Drive file is empty.");
  return {
    file: new File([blob], details.name, { type: details.mimeType }),
    driveUrl: `https://drive.google.com/file/d/${encodeURIComponent(metadata.id)}/view`
  };
}

export async function downloadGoogleDriveFile(file, accessToken) {
  if (!file?.id || !accessToken) throw new Error("Choose a Google Drive file to import.");
  const { apiKey } = getGoogleDriveConfig();
  const metadataUrl = driveApiUrl(file.id, {
    fields: "id,name,mimeType,size,resourceKey",
    supportsAllDrives: "true"
  });
  if (apiKey) metadataUrl.searchParams.set("key", apiKey);
  const response = await fetch(metadataUrl, { headers: driveHeaders(accessToken, file.id, file.resourceKey) });
  if (!response.ok) {
    throw await responseError(response, "Could not read the selected Google Drive file.");
  }
  return downloadDriveFile(await response.json(), { apiKey, accessToken, resourceKey: file.resourceKey });
}

function parsePublicDriveLink(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Enter a valid Google Drive file link.");
  }
  if (url.protocol !== "https:" || !["drive.google.com", "docs.google.com"].includes(url.hostname)) {
    throw new Error("Use an HTTPS sharing link from Google Drive.");
  }
  const id = url.pathname.match(/\/(?:file\/d|document\/d|presentation\/d|spreadsheets\/d)\/([A-Za-z0-9_-]+)/)?.[1] ||
    url.searchParams.get("id");
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new Error("That link does not point to a supported Google Drive file.");
  }
  return { id, resourceKey: url.searchParams.get("resourcekey") || "" };
}

export async function downloadPublicDriveFile(value) {
  const setupMessage = getGoogleDriveSetupMessage();
  if (setupMessage) throw new Error(setupMessage);
  const { id, resourceKey } = parsePublicDriveLink(value);
  const { apiKey } = getGoogleDriveConfig();
  const metadataUrl = driveApiUrl(id, {
    fields: "id,name,mimeType,size,resourceKey",
    supportsAllDrives: "true",
    key: apiKey
  });
  const headers = driveHeaders("", id, resourceKey);
  const metadataResponse = await fetch(metadataUrl, { headers });
  if (!metadataResponse.ok) {
    throw await responseError(
      metadataResponse,
      "Could not access that Drive file. Check that link sharing is enabled."
    );
  }
  const metadata = await metadataResponse.json();
  return downloadDriveFile(metadata, { apiKey, resourceKey });
}

export async function importPublicGoogleDriveTemplate(value) {
  const { file, driveUrl } = await downloadPublicDriveFile(value);
  const templates = await createImportedTemplates(file);
  return templates.map(template => ({ ...template, driveUrl }));
}

export async function importSelectedGoogleDriveTemplates() {
  const { files, accessToken } = await pickGoogleDriveFiles();
  const templates = [];
  const failures = [];

  for (const driveFile of files) {
    try {
      const { file, driveUrl } = await downloadGoogleDriveFile(driveFile, accessToken);
      const imported = await createImportedTemplates(file);
      templates.push(...imported.map(template => ({ ...template, driveUrl })));
    } catch (error) {
      failures.push(`${driveFile.name || "A Drive file"}: ${error.message}`);
    }
  }

  return { selectedCount: files.length, templates, failures };
}
