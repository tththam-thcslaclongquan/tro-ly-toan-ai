export const CURRICULUM: Record<string, { topics: string[]; forbidden: string[] }> = {
  '6': {
    topics: [
      "Tập hợp, phần tử, tập hợp số tự nhiên",
      "Các phép toán với số tự nhiên (cộng, trừ, nhân, chia, luỹ thừa), thứ tự thực hiện phép tính",
      "Tính chia hết, dấu hiệu chia hết (2, 3, 5, 9), số nguyên tố, hợp số, phân tích ra thừa số nguyên tố",
      "Ước chung lớn nhất (ƯCLN), Bội chung nhỏ nhất (BCNN)",
      "Số nguyên, thứ tự trong tập hợp số nguyên và các phép toán (cộng, trừ, nhân, chia)",
      "Phân số, hỗn số, so sánh phân số và các phép toán",
      "Số thập phân, so sánh số thập phân, các phép toán và làm tròn",
      "Tỉ số và tỉ số phần trăm",
      "Hình học cơ bản: điểm, đường thẳng, tia, đoạn thẳng, trung điểm, góc, số đo góc",
      "Hình phẳng trong thực tiễn: tam giác đều, hình vuông, lục giác đều, hình chữ nhật, hình thoi, hình bình hành, hình thang cân",
      "Chu vi và diện tích của các hình phẳng",
      "Tính đối xứng của hình phẳng (trục đối xứng, tâm đối xứng)",
      "Thu thập, phân loại, biểu diễn dữ liệu: bảng, biểu đồ tranh, biểu đồ cột/cột kép",
      "Phép thử nghiệm, sự kiện và xác suất thực nghiệm"
    ],
    forbidden: [
      "Số hữu tỉ, số thực (dạng khái niệm nâng cao)", "Biểu thức đại số (chứa chữ)", "Phương trình, tìm x phức tạp", "Hàm số",
      "Tam giác bằng nhau, tam giác đồng dạng", "Tỉ lệ thức", "Hệ thức lượng", "Đường tròn (tiếp tuyến, góc nội tiếp)"
    ]
  },
  '7': {
    topics: [
      "Số hữu tỉ, số thực, căn bậc hai số học và các phép toán liên quan",
      "Tỉ lệ thức, dãy tỉ số bằng nhau, đại lượng tỉ lệ thuận và tỉ lệ nghịch",
      "Biểu thức đại số, đa thức một biến và các phép toán (cộng, trừ, nhân, chia)",
      "Góc và đường thẳng: góc đối đỉnh, kề bù, tia phân giác, đường thẳng song song và vuông góc",
      "Tam giác: tổng ba góc, các trường hợp bằng nhau của tam giác (c.c.c, c.g.c, g.c.g)",
      "Tam giác cân và quan hệ giữa các yếu tố trong tam giác (cạnh và góc, bất đẳng thức)",
      "Các đường đồng quy trong tam giác: trung trực, trung tuyến, đường cao, phân giác",
      "Hình khối trong thực tiễn: hình hộp chữ nhật, hình lập phương, hình lăng trụ đứng tam giác/tứ giác",
      "Diện tích xung quanh và thể tích của hình hộp, lập phương, lăng trụ đứng",
      "Thống kê: thu thập, phân loại, biểu diễn dữ liệu qua biểu đồ quạt tròn và đoạn thẳng",
      "Xác suất: làm quen với biến cố ngẫu nhiên và xác suất của biến cố"
    ],
    forbidden: [
      "Hằng đẳng thức đáng nhớ", "Phân tích đa thức thành nhân tử", "Tam giác đồng dạng", "Tỉ số lượng giác", "Định lí Pythagoras", "Hàm số",
      "Phương trình bậc hai", "Hệ phương trình", "Đường tròn và các loại góc", "Bất phương trình"
    ]
  },
  '8': {
    topics: [
      "Đa thức nhiều biến, Hằng đẳng thức đáng nhớ, Phân tích đa thức thành nhân tử",
      "Phân thức đại số và các phép toán",
      "Hàm số và đồ thị (khái niệm, hàm số bậc nhất y=ax+b, hệ số góc)",
      "Phương trình bậc nhất một ẩn, giải bài toán bằng cách lập phương trình",
      "Định lí Thalès trong tam giác (thuận, đảo, hệ quả)",
      "Đường trung bình của tam giác, của hình thang",
      "Tính chất đường phân giác của tam giác",
      "Các trường hợp đồng dạng của tam giác (bao gồm tam giác vuông)",
      "Tứ giác, các loại tứ giác đặc biệt (hình thang, hình bình hành, chữ nhật, thoi, vuông)",
      "Định lí Pythagoras",
      "Hình chóp đều (tam giác, tứ giác), diện tích xung quanh và thể tích",
      "Thu thập, phân loại, biểu diễn và phân tích dữ liệu",
      "Mô tả xác suất của biến cố bằng tỉ số, xác suất thực nghiệm"
    ],
    forbidden: [
      "Bất phương trình",
      "Căn bậc hai phức tạp", "Hệ phương trình bậc nhất hai ẩn", "Phương trình bậc hai (công thức nghiệm, Vi-ét)",
      "Tỉ số lượng giác (sin, cos, tan)", "Hệ thức lượng nâng cao", "Đường tròn (góc nội tiếp, tứ giác nội tiếp)"
    ]
  },
  '9': {
    topics: [
      "Căn bậc hai, căn bậc ba, biến đổi và rút gọn biểu thức chứa căn",
      "Hàm số bậc nhất y=ax+b và đồ thị",
      "Hệ hai phương trình bậc nhất hai ẩn",
      "Hàm số bậc hai y=ax^2 và đồ thị",
      "Phương trình bậc hai một ẩn, công thức nghiệm, hệ thức Vi-ét",
      "Bất đẳng thức, bất phương trình bậc nhất một ẩn",
      "Hệ thức lượng trong tam giác vuông, tỉ số lượng giác của góc nhọn (sin, cos, tan)",
      "Đường tròn: sự xác định, vị trí tương đối của đường thẳng và đường tròn, của hai đường tròn",
      "Tiếp tuyến của đường tròn, tính chất hai tiếp tuyến cắt nhau",
      "Các loại góc với đường tròn: góc ở tâm, góc nội tiếp, góc tạo bởi tiếp tuyến và dây cung",
      "Tứ giác nội tiếp",
      "Đa giác đều, độ dài đường tròn, diện tích hình tròn và hình quạt",
      "Hình học không gian: Hình trụ, hình nón, hình cầu (diện tích xung quanh, thể tích)"
    ],
    forbidden: [
      "Giới hạn, đạo hàm, tích phân", "Hình học giải tích trong không gian", "Số phức"
    ]
  }
};

export const KEYWORDS_TO_TAGS: { re: RegExp; tag: string }[] = [
  { re: /hệ\s*phương\s*trình|hệ\s*hai\s*phương\s*trình|giải\s*hệ/gi, tag: "hệ phương trình" },
  { re: /phương\s*trình\s*bậc\s*hai|x\^2|ax\^2|vi-ét|viet/gi, tag: "phương trình bậc hai & Vi-ét" },
  { re: /hàm\s*số\s*bậc\s*nhất/gi, tag: "hàm số bậc nhất" },
  { re: /hàm\s*số|đồ\s*thị/gi, tag: "hàm số & đồ thị" },
  { re: /sin|cos|tan|cot|tỉ\s*số\s*lượng\s*giác|hệ\s*thức\s*lượng/gi, tag: "tỉ số lượng giác & hệ thức lượng" },
  { re: /góc\s*nội\s*tiếp|góc\s*ở\s*tâm|đường\s*tròn|tiếp\s* tuyến|tứ\s*giác\s*nội\s*tiếp|dây\s*cung|vị\s*trí\s*tương\s*đối.*đường\s*tròn/gi, tag: "đường tròn & góc" },
  { re: /đồng\s*dạng|ta-lét|talét|thalès/gi, tag: "đồng dạng & Thalès" },
  { re: /pythagore|pi-ta-go|pytago/gi, tag: "định lý Pythagoras" },
  { re: /hằng\s*đẳng\s*thức|phân\s*thức|nhân\s*tử/gi, tag: "hằng đẳng thức & phân thức" },
  { re: /bất\s*đẳng\s*thức|bất\s*phương\s*trình/gi, tag: "bất đẳng thức & bất phương trình" },
  { re: /phương\s*trình\s*(bậc\s*nhất)?|tìm\s*x/gi, tag: "phương trình bậc nhất" },
  { re: /tam\s*giác\s*bằng\s*nhau|c\.g\.c|g\.c\.g|c\.c\.c/gi, tag: "tam giác bằng nhau" },
  { re: /tỉ\s*lệ\s*thức|dãy\s*tỉ\s*số|tỉ\s*lệ\s*thuận|tỉ\s*lệ\s*nghịch/gi, tag: "tỉ lệ thức" },
  { re: /đa\s*thức|đơn\s*thức|biểu\s*thức\s*đại\s*số/gi, tag: "đa thức & biểu thức đại số" },
  { re: /lăng\s*trụ|hình\s*hộp|hình\s*nón|hình\s*cầu|hình\s*trụ/gi, tag: "hình học không gian" },
  { re: /chu\s*vi|diện\s*tích|hình\s*(chữ\s*nhật|vuông|thang|bình\s*hành|thoi|tứ\s*giác)/gi, tag: "hình phẳng cơ bản" },
  { re: /phân\s*số|số\s*hữu\s*tỉ|số\s*thực|số\s*nguyên|số\s*thập\s*phân/gi, tag: "số học" },
  { re: /chia\s*hết|ước|bội|ƯCLN|BCNN|số\s*nguyên\s*tố/gi, tag: "số học - chia hết" },
  { re: /biểu\s*đồ|thống\s*kê|xác\s*suất/gi, tag: "thống kê & xác suất" },
];

export const TAG_MIN_GRADE: Record<string, number> = {
  "hệ phương trình": 9,
  "phương trình bậc hai & Vi-ét": 9,
  "tỉ số lượng giác & hệ thức lượng": 9,
  "đường tròn & góc": 9,
  "hàm số bậc nhất": 8,
  "hàm số & đồ thị": 8,
  "đồng dạng & Thalès": 8,
  "định lý Pythagoras": 8,
  "hằng đẳng thức & phân thức": 8,
  "bất đẳng thức & bất phương trình": 9,
  "phương trình bậc nhất": 7, // Basic finding x can be earlier, but formal equations are here
  "tam giác bằng nhau": 7,
  "đa thức & biểu thức đại số": 7,
  "tỉ lệ thức": 7,
  "hình học không gian": 7, // Basic shapes in 6, but properties start here
  "hình phẳng cơ bản": 6,
  "số học": 6,
  "số học - chia hết": 6,
  "thống kê & xác suất": 6,
};

export const formulaHints = {
  square: {
    labels: ["hình vuông", "vuông"],
    area: { latex: "S = a^2", condition: "cạnh a", pitfall: "nhầm S = 4a" },
    perimeter: { latex: "P = 4a", condition: "cạnh a" }
  },
  rectangle: {
    labels: ["hình chữ nhật", "chữ nhật"],
    area: { latex: "S = a\\times b", condition: "hai cạnh kề a, b" },
    perimeter: { latex: "P = 2(a+b)", condition: "hai cạnh kề a, b" }
  },
  circle: {
    labels: ["hình tròn", "đường tròn", "tròn"],
    area: { latex: "S = \\pi r^2", condition: "bán kính r" },
    perimeter: { latex: "C = 2\\pi r", condition: "bán kính r" },
    radiusFromArea: { latex: "r = \\sqrt{\\frac{S}{\\pi}}", condition: "biết diện tích S" },
    radiusFromPerimeter: { latex: "r = \\frac{C}{2\\pi}", condition: "biết chu vi C" }
  },
  triangle: {
    labels: ["tam giác"],
    area_basic: { latex: "S = \\frac{1}{2}ah", condition: "đáy a, chiều cao h tương ứng" },
    area_heron: { latex: "S = \\sqrt{p(p-a)(p-b)(p-c)}", condition: "ba cạnh a,b,c và p là nửa chu vi" },
    perimeter: { latex: "P = a+b+c", condition: "ba cạnh a, b, c"}
  },
  trapezoid: {
      labels: ["hình thang"],
      area: { latex: "S = \\frac{1}{2}(a+b)h", condition: "hai đáy a, b và chiều cao h"}
  },
  cylinder: {
      labels: ["hình trụ"],
      volume: { latex: "V = \\pi r^2 h", condition: "bán kính đáy r, chiều cao h"},
      surface_area: { latex: "S_{xq} = 2\\pi rh", condition: "bán kính đáy r, chiều cao h"}
  },
  cone: {
      labels: ["hình nón"],
      volume: { latex: "V = \\frac{1}{3}\\pi r^2 h", condition: "bán kính đáy r, chiều cao h"},
  },
  sphere: {
      labels: ["hình cầu"],
      volume: { latex: "V = \\frac{4}{3}\\pi r^3", condition: "bán kính r"},
      surface_area: { latex: "S = 4\\pi r^2", condition: "bán kính r"},
  }
} as const;