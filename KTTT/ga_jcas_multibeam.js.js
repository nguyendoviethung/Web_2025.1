//1.Tham số hệ thống 

const N_ANTENNAS = 8; // Số anten trong mảng

// Tham số GA
const POP_SIZE = 50;        // kích thước quần thể
const GENERATIONS = 200;    // số thế hệ
const CROSS_RATE = 0.8;     // xác suất lai
const MUT_RATE = 0.1;       // xác suất đột biến

// Các hướng quan tâm
const COMM_ANGLE = 0;                       // hướng truyền thông (user)
const SENSING_ANGLES = [-40, -20, 20, 40];  // các hướng sensing


// 2.Hàm tiện ích

// Sinh số ngẫu nhiên trong [min, max]
function rand(min, max) {
  return min + Math.random() * (max - min);
}

// Giữ giá trị trong khoảng [min, max]
function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}


// Biểu diễn cá thể
/*
 * Mỗi cá thể (chromosome) là 1 cấu hình beamforming:
 * [a1, φ1, a2, φ2, ..., aN, φN]
 * - ai: biên độ anten thứ i
 * - φi: pha anten thứ i
 */

// Khởi tạo cá thể ngẫu nhiên
function randomChromosome() {
  const chrom = [];
  for (let i = 0; i < N_ANTENNAS; i++) {
    chrom.push(rand(0, 1));             // biên độ
    chrom.push(rand(0, 2 * Math.PI));   // pha
  }
  return chrom;
}

// 4. Hàm mô phỏng đặc tính anten mảng

// Mô phỏng độ mạnh tín hiệu theo 1 hướng
function arrayFactor(chrom, angleDeg) {
  const angle = angleDeg * Math.PI / 180;
  let real = 0;
  let imag = 0;

  for (let i = 0; i < N_ANTENNAS; i++) {
    const a = chrom[2 * i];
    const phi = chrom[2 * i + 1];

    // pha lệch theo vị trí anten
    const phaseShift = i * Math.sin(angle);

    real += a * Math.cos(phi + phaseShift);
    imag += a * Math.sin(phi + phaseShift);
  }

  // độ lớn vector phức
  return Math.sqrt(real * real + imag * imag);
}


//5. Hàm fitness

function fitness(chrom) {
  // Công suất truyền thông
  const commPower = arrayFactor(chrom, COMM_ANGLE);

  // Công suất sensing (lấy trung bình)
  let sensingPower = 0;
  for (const ang of SENSING_ANGLES) {
    sensingPower += arrayFactor(chrom, ang);
  }
  sensingPower /= SENSING_ANGLES.length;

    // Tính sidelobe (góp phần trừ vào fitness)
  let sidelobe = 0;
  for (let ang = -90; ang <= 90; ang += 10) {
    const nearComm = Math.abs(ang - COMM_ANGLE) <= 10;
    const nearSensing = SENSING_ANGLES.includes(ang);

    if (!nearComm && !nearSensing) {
      sidelobe += arrayFactor(chrom, ang);
    }   
  }

  // Hàm mục tiêu tổng hợp
  return (
    2.0 * commPower +
    1.0 * sensingPower -
    0.5 * sidelobe
  );
}


// 6. SELECTION (TOURNAMENT)

function tournamentSelection(pop) {
  const k = 3;
  let best = null;

  for (let i = 0; i < k; i++) {
    const ind = pop[Math.floor(Math.random() * pop.length)];
    if (!best || ind.fitness > best.fitness) {
      best = ind;
    }
  }
  return best.chrom;
}


/******************** 7. CROSSOVER ********************/
/*
 * Lai 1 điểm
 */

function crossover(p1, p2) {
  if (Math.random() > CROSS_RATE) {
    return [p1.slice(), p2.slice()];
  }

  const point = Math.floor(Math.random() * p1.length);
  const c1 = p1.slice(0, point).concat(p2.slice(point));
  const c2 = p2.slice(0, point).concat(p1.slice(point));

  return [c1, c2];
}


/******************** 8. MUTATION ********************/
/*
 * Đột biến:
 * - biên độ: nhiễu nhỏ
 * - pha: nhiễu nhỏ trong [0, 2π]
 */

function mutate(chrom) {
  for (let i = 0; i < chrom.length; i++) {
    if (Math.random() < MUT_RATE) {
      if (i % 2 === 0) {
        chrom[i] = clamp(chrom[i] + rand(-0.1, 0.1), 0, 1);
      } else {
        chrom[i] = (chrom[i] + rand(-0.2, 0.2)) % (2 * Math.PI);
      }
    }
  }
}


/******************** 9. VÒNG LẶP GA GỐC ********************/

// Khởi tạo quần thể ban đầu
let population = Array.from({ length: POP_SIZE }, () => {
  const chrom = randomChromosome();
  return { chrom, fitness: fitness(chrom) };
});

// Tiến hóa qua các thế hệ
for (let gen = 0; gen < GENERATIONS; gen++) {
  const newPopulation = [];

  while (newPopulation.length < POP_SIZE) {
    const p1 = tournamentSelection(population);
    const p2 = tournamentSelection(population);

    const [c1, c2] = crossover(p1, p2);

    mutate(c1);
    mutate(c2);

    newPopulation.push({ chrom: c1, fitness: fitness(c1) });
    if (newPopulation.length < POP_SIZE) {
      newPopulation.push({ chrom: c2, fitness: fitness(c2) });
    }
  }

  population = newPopulation;

  // Lấy cá thể tốt nhất
  const best = population.reduce((a, b) =>
    a.fitness > b.fitness ? a : b
  );

  console.log(
    `Gen ${gen} | Best fitness = ${best.fitness.toFixed(3)}`
  );
}
