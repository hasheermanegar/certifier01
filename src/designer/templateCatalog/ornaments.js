export function createOrnaments(shape, p, style) {
  const { primary, accent, secondary } = p;

  switch (style) {
    case "royal":
      shape("border", 18, 18, 1084, 754, "transparent", accent, 5);
      shape("border", 30, 30, 1060, 730, "transparent", primary, 1);
      shape("border", 42, 42, 1036, 706, "transparent", accent, 2);
      for (const x of [55, 1015]) {
        for (const y of [55, 685]) {
          shape("diamond", x, y, 50, 50, accent);
          shape("diamond", x + 12, y + 12, 26, 26, primary);
        }
      }
      break;

    case "academic":
      shape("border", 22, 22, 1076, 746, "transparent", primary, 6);
      shape("border", 36, 36, 1048, 718, "transparent", accent, 2);
      shape("circle", 515, 55, 90, 90, secondary, accent, 3);
      shape("star", 535, 75, 50, 50, accent);
      break;

    case "corporate":
      shape("rectangle", 0, 0, 1120, 20, primary);
      shape("rectangle", 0, 20, 1120, 5, accent);
      shape("rectangle", 0, 760, 1120, 30, primary);
      shape("triangle", 0, 590, 170, 170, secondary);
      shape("triangle", 950, 590, 170, 170, secondary);
      break;

    case "heritage":
      shape("border", 20, 20, 1080, 750, "transparent", accent, 3);
      for (let i = 0; i < 20; i++) {
        shape("diamond", 40 + i * 53, 30, 30, 30, accent);
        shape("diamond", 40 + i * 53, 730, 30, 30, accent);
      }
      break;

    case "minimal":
      shape("rectangle", 65, 65, 990, 3, accent);
      shape("rectangle", 65, 722, 990, 3, accent);
      shape("rectangle", 65, 65, 5, 100, primary);
      break;

    case "midnight":
      shape("border", 24, 24, 1072, 742, "transparent", accent, 3);
      shape("border", 34, 34, 1052, 722, "transparent", accent, 1);
      shape("diamond", 535, 55, 50, 50, accent);
      break;

    case "botanical":
      for (let i = 0; i < 5; i++) {
        shape("oval", 20 + i * 12, 25 + i * 30, 65, 28, secondary);
        shape("oval", 1035 - i * 12, 737 - i * 30, 65, 28, secondary);
      }
      shape("border", 38, 38, 1044, 714, "transparent", accent, 1);
      break;

    case "technology":
      shape("hexagon", 15, 15, 120, 100, secondary);
      shape("hexagon", 985, 675, 120, 100, secondary);
      shape("hexagon", 40, 40, 70, 55, accent);
      shape("hexagon", 1010, 700, 70, 55, accent);
      shape("rectangle", 160, 35, 800, 3, primary);
      shape("rectangle", 160, 752, 800, 3, primary);
      break;

    case "artistic":
      shape("circle", 0, 0, 160, 160, secondary);
      shape("circle", 960, 630, 160, 160, secondary);
      shape("triangle", 20, 20, 90, 90, accent);
      shape("triangle", 1010, 680, 90, 90, accent);
      break;

    case "classic":
      shape("border", 28, 28, 1064, 734, "transparent", primary, 3);
      shape("border", 42, 42, 1036, 706, "transparent", accent, 1);
      shape("rectangle", 460, 85, 200, 3, accent);
      break;
  }
}
