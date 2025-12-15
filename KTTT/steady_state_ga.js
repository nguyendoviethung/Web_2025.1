/*************************************
 * STEADY-STATE GA FOR JCAS MULTIBEAM *
 *************************************/

// ====== THAM SỐ BÀI TOÁN ======
const N_ANTENNAS = 8;
const COMM_ANGLE = 0;
const SENSING_ANGLES = [-40, -20, 20, 40];

// ====== THAM SỐ GA ======
const POP_SIZE = 30;
const MUTATION_RATE = 0.1;
const ITERATIONS = 3000;

// ====== HÀM TIỆN ÍCH ======
function rand(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

// ====== KHỞI TẠO CÁ THỂ ======
function randomChromosome() {
  const chrom = [];
  for (let i = 0; i < N_ANTENNAS; i++) {
    chrom.push(rand(0, 1));             // biên độ
    chrom.push(rand(-Math.PI, Math.PI)); // pha
  }
  return chrom;
}

// ====== ARRAY FACTOR ======
function arrayFactor(chrom, angleDeg) {
  const angle = angleDeg * Math.PI / 180;
  let real = 0, imag = 0;

  for (let i = 0; i < N_ANTENNAS; i++) {
    const a = chrom[2 * i];
    const phi = chrom[2 * i + 1];
    const phaseShift = i * Math.sin(angle);

    real += a * Math.cos(phi + phaseShift);
    imag += a * Math.sin(phi + phaseShift);
  }
  return Math.sqrt(real * real + imag * imag);
}

// ====== FITNESS FUNCTION ======
function fitness(chrom) {
  const commPower = arrayFactor(chrom, COMM_ANGLE);

  let sensingPower = 0;
  for (const ang of SENSING_ANGLES) {
    sensingPower += arrayFactor(chrom, ang);
  }
  sensingPower /= SENSING_ANGLES.length;

  let sidelobe = 0;
  for (let ang = -90; ang <= 90; ang += 10) {
    const nearComm = Math.abs(ang - COMM_ANGLE) <= 10;
    const nearSensing = SENSING_ANGLES.includes(ang);

    if (!nearComm && !nearSensing) {
      sidelobe += arrayFactor(chrom, ang);
    }
  }

  return 2.0 * commPower + 1.0 * sensingPower - 0.5 * sidelobe;
}

// ====== CHỌN CHA MẸ (TOURNAMENT) ======
function tournament(pop) {
  const a = pop[Math.floor(Math.random() * pop.length)];
  const b = pop[Math.floor(Math.random() * pop.length)];
  return fitness(a) > fitness(b) ? a : b;
}

// ====== LAI GHÉP ======
function crossover(p1, p2) {
  const child = [];
  for (let i = 0; i < p1.length; i++) {
    child[i] = Math.random() < 0.5 ? p1[i] : p2[i];
  }
  return child;
}

// ====== ĐỘT BIẾN ======
function mutate(chrom) {
  for (let i = 0; i < chrom.length; i++) {
    if (Math.random() < MUTATION_RATE) {
      if (i % 2 === 0) {
        chrom[i] = clamp(chrom[i] + rand(-0.1, 0.1), 0, 1);
      } else {
        chrom[i] = clamp(chrom[i] + rand(-0.2, 0.2), -Math.PI, Math.PI);
      }
    }
  }
}

// ====== STEADY-STATE GA ======
function steadyStateGA() {
  let population = Array.from({ length: POP_SIZE }, randomChromosome);

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const parent1 = tournament(population);
    const parent2 = tournament(population);

    let child = crossover(parent1, parent2);
    mutate(child);

    // tìm cá thể tệ nhất
    let worstIndex = 0;
    let worstFitness = fitness(population[0]);

    for (let i = 1; i < population.length; i++) {
      const f = fitness(population[i]);
      if (f < worstFitness) {
        worstFitness = f;
        worstIndex = i;
      }
    }

    // thay thế nếu con tốt hơn
    if (fitness(child) > worstFitness) {
      population[worstIndex] = child;
    }

    if (iter % 500 === 0) {
      console.log(`Iter ${iter}, Best fitness: ${
        Math.max(...population.map(fitness)).toFixed(2)
      }`);
    }
  }

  return population.reduce((best, c) =>
    fitness(c) > fitness(best) ? c : best
  );
}

// ====== CHẠY ======
const best = steadyStateGA();
console.log("Best solution:", best);
console.log("Fitness:", fitness(best));
    