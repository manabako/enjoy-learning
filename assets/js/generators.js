// game.jsから分離した問題生成ロジック
export const randInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ログの計算
const calLog = () => {
  const base = randInt(2, 5);
  const flag = randInt(0,4);
  if (flag === 0) {
    const y = randInt(0,5);
    const x = Math.pow(base, y);
    return { solution: y, formula: `\\log_{${base}} ${x}` };
  } else if (flag === 1) {
    const y = randInt(1,5);
    const x = Math.pow(base, y);
    return { solution: -y, formula: `\\log_{${base}} \\frac{1}{${x}}` };
  } else if (flag === 2) {
    const y = randInt(0,3);
    const x = Math.pow(base, y);
    const z = randInt(2,10);
    return { solution: Math.pow(z, y), formula: `${x}^{\\log_{${base}} ${z}}` };
  } else if (flag === 3) {
    const y = randInt(0,5);
    const x = Math.pow(base, y);
    const dummy = randInt(1,9);
    return { solution: y, formula: `\\log_{${base}} ${dummy}\\log_{${dummy}} ${x}` };
  } else {
    const y = randInt(1,5);
    const x = Math.pow(base, y);
    const dummyList = [2,3,5].filter(v => v !== base);
    const dummy = dummyList[Math.floor(Math.random()*dummyList.length)];
    return { solution: y, formula: `\\log_{${base}} ${dummy*x} - \\log_{${base}} ${dummy}` };
  }
}

// 積分の計算
const calIntegral = () => {
  const n = randInt(1,5);
  const toA = n * randInt(1,2);
  let solution;
  let formula;
  if (n === 1) {
    formula = `\\int_0^{${toA}} dx`;
    solution = Math.pow(toA, n) / n;
  } else if (n === 2) {
    formula = `\\int_0^{${toA}} x\\,dx`;
    solution = Math.pow(toA, n) / n;
  } else if (n === 3) {
    formula = `\\int_0^{${toA}} x^{${n-1}}\\,dx`;
    solution = Math.pow(toA, n) / n;
  } else if (n === 4) {
    const thetaMap = ["\\pi","\\frac{\\pi}{2}","\\frac{3}{2}\\pi","2\\pi"];
    const farcMap = [1,0.5,1.5,2];
    const key = randInt(0,3);
    if (Math.random() < 0.5) {
      formula = `\\int_0^{${thetaMap[key]}} \\sin x\\,dx`;
      solution = 1 - Math.cos(Math.PI * farcMap[key]);
    } else {
      formula = `\\int_0^{${thetaMap[key]}} \\cos x\\,dx`;
      solution = Math.sin(Math.PI * farcMap[key]);
    }
  } else {
    const pQ = randInt(1,6);
    const p = randInt(1,9);
    const q = pQ + p;
    const sign = Math.random() < 0.5 ? -1 : 1;
    let k = sign*randInt(1,3);
    if (pQ === 5) {
      k *= 6;
    } else if (pQ === 4 || pQ === 2) {
      k *= 3;
    } else if (pQ === 3) {
      k *= 2;
    }
    if (k === 1) {
      formula = `\\int_${p}^{${q}}(x - ${p})(x - ${q})\\,dx`;
    } else if (k === -1) {
      formula = `\\int_${p}^{${q}}-(x - ${p})(x - ${q})\\,dx`;
    } else {
      formula = `\\int_${p}^{${q}}${k}(x - ${p})(x - ${q})\\,dx`;
    };
    solution = -k * ( (q - p)**3 ) / 6;
  }
  return { solution: Math.round(solution), formula };
}


// 微分の計算
const calDifferential = () => {
  const flag = randInt(0,2);
  if (flag === 0) {
    const n = randInt(1,3);
    const a = randInt(1,4);
    const solution = n * Math.pow(a, n-1);
    let formula;
    if (n === 1) {
      formula = `\\left. \\frac{d}{dx} x \\right|_{x=${a}}`;
    } else {
      formula = `\\left. \\frac{d}{dx} x^{${n}} \\right|_{x=${a}}`;
    }
    return { solution, formula };
  } else if (flag === 1) {
    const a = randInt(2,4);
    const solution = a ;
    const formula = `\\left. \\frac{d}{dx} \\ln x \\right|_{x=1/${a}}`;
    return { solution, formula };
  } else {
    const keys = ["0","\\pi","\\frac{\\pi}{2}"];
    const key = randInt(0,2);
    const theta = keys[key];
    const pick = randInt(0,1);
    if (pick === 0) {
      const cosVals = [1,-1,0];
      return { solution: cosVals[key], formula: `\\left. \\frac{d}{dx}\\sin x \\right|_{x=${theta}}` };
    } else {
      const sinVals = [0,0,1];
      return { solution: -sinVals[key], formula: `\\left. \\frac{d}{dx}\\cos x \\right|_{x=${theta}}` };
    }
  }
}

// 三角関数の計算
const calTrigonometric = () => {
  const thetaMap = ["0","\\pi","\\frac{\\pi}{2}","\\frac{\\pi}{3}","\\frac{\\pi}{4}","\\frac{\\pi}{6}"];
  const flag = randInt(0,2);
  if (flag === 0) { // 恒等式
    const key = randInt(0,4); 
    return { solution: 1, formula: `\\sin^{2} ${thetaMap[key]} + \\cos^{2} ${thetaMap[key]}` };
  } else if (flag === 1) {  // sin, cos, tan
    const flag2 = randInt(0,2);
    const key = randInt(0,2); 
    if (flag2 === 0) {
      const sinVals = [0,0,1];
      return { solution: sinVals[key], formula: `\\sin ${thetaMap[key]}` };
    } else if (flag2 === 1) {
      const cosVals = [1,-1,0]; 
      return { solution: cosVals[key], formula: `\\cos ${thetaMap[key]}` };
    } else {
      const key = [0,1,4][Math.floor(Math.random()*3)]; 
      const tanVals = {0:0,1:0,4:1}; 
      return { solution: tanVals[key], formula: `\\tan ${thetaMap[key]}` };
    }
  } else {  // sin^2, cos^2
    const key = randInt(0,5);
    if (Math.random() < 0.5) {
      const sin2Vals = [0,0,1,0.75,0.5,0.25];
      return { solution: 12*sin2Vals[key], formula: `12\\sin^2 ${thetaMap[key]}` };
    } else {
      const cos2Vals = [1,1,0,0.25,0.5,0.75];
      return { solution: 12*cos2Vals[key], formula: `12\\cos^2 ${thetaMap[key]}` };
    }
  }
}

// 組み合わせ・順列・階乗の計算
const calCombination = () => {
  const flag = randInt(0,3);
  if (flag === 0) { // n!, n!!
    const n = randInt(0,5);
    let sol = 1;
    if (Math.random() < 0.7) {  // n!
      for (let i=2;i<=n;i++) sol *= i;
      return { solution: sol, formula: `${n}!` };
    } else {  // n!!
      for (let i=n;i>0;i-=2) sol *= i;
      return { solution: sol, formula: `${n}!!` };
    }
  } else if (flag === 1) {
    const n = randInt(1,5); const k = randInt(0,n); // permutations nPk
    let perm = 1;
    for (let i=0;i<k;i++) perm *= (n - i);
    return { solution: perm, formula: `{{}}_{${n}} \\mathrm{ P }_{${k}}` };
  } else if (flag === 2) {
    const n = randInt(1,8); const k = randInt(1,n);
    // nCk
    let num=1, den=1;
    for (let i=0;i<k;i++){ num*= (n - i); den *= (i+1); }
    return { solution: Math.round(num/den), formula: `{{}}_{${n}} \\mathrm{ C }_{${k}}` };
  } else {
    const n = randInt(1,4); const k = randInt(1,4);
    // multiset: C(n+k-1, k)
    const nn = n + k - 1; const kk = k;
    let num=1, den=1;
    for (let i=0;i<kk;i++){ num*= (nn - i); den *= (i+1); }
    return { solution: Math.round(num/den), formula: `{{}}_{${n}} \\mathrm{ H }_{${k}}` };
  }
}

// 数列の和の計算
const calSequence = () => {
  const flag = randInt(0,1);
  if (flag === 0) {
    const a = randInt(2,10); const r = randInt(2,3); const n = randInt(2,4);
    const solution = Math.round(a*(Math.pow(r,n)-1)/(r-1));
    return { solution, formula: `\\displaystyle ${a}\\sum_{k=0}^{${n-1}} ${r}^{k}` };
  } else {
    const a = randInt(1,10); const d = randInt(2,3); const n = randInt(2,4);
    const solution = Math.round((n + 1)*(2*a + n*d)/2);
    return { solution, formula: `\\displaystyle \\sum_{k=0}^{${n}} (${d}n + ${a})` };
  }
}

// 天井関数・床関数の計算
function calFloorCeil() {
  const tuples = [[Math.E, 'e'], [Math.PI, '\\pi'], [Math.SQRT2, '\\sqrt{2}']];
  const idx = randInt(0,2);
  let [x,xs] = tuples[idx];
  if (Math.random() < 0.5) { x = -x; xs = '-' + xs; }
  const flag = randInt(0,2);
  if (flag === 0) return { solution: Math.ceil(x), formula: `\\lceil ${xs} \\rceil` };
  else if (flag === 1) return { solution: Math.floor(x), formula: `\\lfloor ${xs} \\rfloor` };
  else return { solution: Math.floor(x), formula: `[ ${xs} ]` };
}

// 行列式の計算
const calDet = () => {
  const flag = randInt(0,1);
  if (flag === 0) {
    const a11 = randInt(0,8), a12 = randInt(0,8), a21 = randInt(0,8), a22 = randInt(0,8);
    const det = a11*a22 - a12*a21;
    return { solution: det, formula: `\\begin{vmatrix} ${a11} & ${a12} \\\\ ${a21} & ${a22} \\end{vmatrix}` };
  } else {
    // 3x3 small int matrix
    const a = Array.from({length:3}, () => Array.from({length:3}, ()=> randInt(1,3)));
    // 1つの要素を0にする
    a[randInt(0,2)][randInt(0,2)] = 0;
    // compute determinant via rule of Sarrus / general
    const det = Math.round(
      a[0][0]*(a[1][1]*a[2][2]-a[1][2]*a[2][1])
      - a[0][1]*(a[1][0]*a[2][2]-a[1][2]*a[2][0])
      + a[0][2]*(a[1][0]*a[2][1]-a[1][1]*a[2][0])
    );
    const matrixTex = '\\begin{vmatrix}' + a.map(row => row.join('&')).join('\\\\') + '\\end{vmatrix}';
    return { solution: det, formula: matrixTex };
  }
}

// 複素数の計算
const calComplex = () => {
  const flag = 0;
  if (flag === 0) {
    const a = randInt(1,5); const b = randInt(1,5);
    const real = a;
    const imag = b;
    const solution = real*real + imag*imag;
    return { solution, formula: `| ${a} + ${b}i |^2` };
  }
}

// 極限の計算
const calLimit = () => {
  const flag = randInt(0,1);
  if (flag === 0) {
    return { solution: 1, formula: `\\lim_{x\\to 0} \\frac{\\sin x}{x}`};
  } else {
    return { solution: 0, formula: `\\lim_{x\\to \\infty} \\frac{\\sin x}{x}`};
  }
}

// Export all generators
export const generators = [
    calLog,
    calIntegral,
    calDifferential,
    calTrigonometric,
    calCombination,
    calSequence,
    calFloorCeil,
    calDet,
    calComplex,
    calLimit
];