# import numpy as np # 追加
import math
import random
import numpy as np

def cal_math():
    # flagで分岐
    flag = random.randrange(8)
    if flag == 0:   # Log
        solution, formula = cal_log()
    elif flag == 1: # 積分
        solution, formula = cal_integral()
    elif flag == 2: # 積分
        solution, formula = cal_differential()
    elif flag == 3: # 三角関数
        solution, formula = cal_trigonometric()
    elif flag == 4: # 順列・組み合わせ
        solution, formula = cal_combination()
    elif flag == 5: # 数列
        solution, formula = cal_sequence()
    elif flag == 6: # 天井関数・床関数
        solution, formula = cal_floor_ceil()
    else:   # 行列式
        solution, formula = cal_det()
    return solution, formula

def cal_log(flag = -1):  # logの出力
    base = random.randrange(2, 6)
    # flagで分岐
    if flag < 0:
        flag = random.randrange(5)
    if flag == 0:   # シンプルなロLog
        y = random.randrange(0, 6)
        x = base**y
        solution = y
        formula = f"\\log_{base} {x}"
    elif flag == 1: # xが逆数
        y = random.randrange(1, 6)
        x = base**y
        solution = -y
        formula = f"\\log_{base} \\frac{{1}}{{{x}}}"
    elif flag == 2:
        y = random.randrange(0, 4)
        x = base**y
        z = random.randrange(2, 11)
        solution = z**y
        formula = f"{x}^{{\\log_{base} {z}}}"
    elif flag == 3:
        y = random.randrange(0, 6)
        x = base**y
        dummy = random.randrange(1, 10)
        solution = y
        formula = f"\\log_{base} {dummy}\\log_{dummy} {x}"
    elif flag == 4:
        y = random.randrange(1, 6)
        x = base**y
        dummy_list = [2, 3, 5]
        if base in dummy_list:
            dummy_list.remove(base)
        dummy = random.choice(dummy_list)
        solution = y
        formula = f"\\log_{base} {dummy*x} - \\log_{base} {dummy}"
    else:
        solution, formula = 0, 0
    return solution, formula

def cal_integral():    # 積分
    n = random.randrange(1, 4)
    to_a = n*random.randrange(1, 3)
    solution = int(to_a**n/n)
    if n == 1:
        formula = f"\\int_0^{to_a} dx"
    elif n == 2:
        formula = f"\\int_0^{to_a} x dx"
    else:
        formula = f"\\int_0^{to_a} x^{n-1} dx"
    return solution, formula

def cal_differential(flag = -1):    # 微分
    if flag < 0:
        flag = random.randrange(2)
    if flag == 0:   # x^n
        n = random.randrange(1, 4)
        to_a = random.randrange(1, 5)
        solution = n*to_a**(n-1)
        if n == 1:
            formula = f"\\left. \\frac{{d}}{{dx}} x \\right|_{{x={to_a}}}"
        else:
            formula = f"\\left. \\frac{{d}}{{dx}} x^{n} \\right|_{{x={to_a}}}"
    else:   # sin/cos
        theta_dic = {0: "0", 1:"\\pi", 2:"\\frac{\\pi}{2}", 3:"\\frac{\\pi}{3}", 4:"\\frac{\\pi}{4}"}
        key = random.randrange(0, 3)
        theta = theta_dic[key]
        flag = random.randrange(2)
        if flag == 0: # sin
            cos_dic = {0:1, 1:-1, 2:0}
            solution = cos_dic[key]
            formula = f"\\left. \\frac{{d}}{{dx}} \\sin x \\right|_{{x={theta}}}"
        elif flag == 1: # cos
            sin_dic = {0:0, 1:0, 2:1}
            solution = -sin_dic[key]
            formula = f"\\left. \\frac{{d}}{{dx}} \\cos x \\right|_{{x={theta}}}"
    return solution, formula

def cal_trigonometric(flag = -1):
    theta_dic = {0: "0", 1:"\\pi", 2:"\\frac{\\pi}{2}", 3:"\\frac{\\pi}{3}", 4:"\\frac{\\pi}{4}"}
    # flagで分岐
    if flag < 0:
        flag = random.randrange(4)
    if flag == 0:   # sin2 + cos2 = 1
        solution = 1
        key = random.randrange(0, 5)
        theta = theta_dic[key]
        formula = f"\\sin ^2 {theta} + \\cos ^2 {theta}"
    elif flag == 1: # sin
        sin_dic = {0:0, 1:0, 2:1}
        key = random.randrange(0, 3)
        theta = theta_dic[key]
        solution = sin_dic[key]
        formula = f"\\sin {theta}"
    elif flag == 2: # cos
        cos_dic = {0:1, 1:-1, 2:0}
        key = random.randrange(0, 3)
        theta = theta_dic[key]
        solution = cos_dic[key]
        formula = f"\\cos {theta}"
    else:           # tan
        tan_dic = {0:0, 1:0, 4:1}
        key = random.choice([0, 1, 4])
        theta = theta_dic[key]
        solution = tan_dic[key]
        formula = f"\\tan {theta}"
    return solution, formula

def cal_combination(flag = -1):
    # flagで分岐
    if flag < 0:
        flag = random.randrange(4)
    if flag == 0:   # 階乗
        n = random.randrange(0, 5)
        solution = math.factorial(n)
        formula = f"{n}!"
    elif flag == 1: # 順列
        n = random.randrange(1, 5)
        k = random.randrange(0, n + 1)
        solution = math.perm(n, k)
        formula = f"{{}}_{n} \mathrm{{ P }}_{k}"
    elif flag == 2: # 組合せ
        n = random.randrange(1, 9)
        k = random.randrange(1, n + 1)
        solution = math.comb(n, k)
        formula = f"{{}}_{n} \mathrm{{ C }}_{k}"
    else: # 重複組合せ
        n = random.randrange(1, 5)
        k = random.randrange(1, 5)
        solution = math.comb(n + k - 1, k)
        formula = f"{{}}_{n} \mathrm{{ H }}_{k}"
    return solution, formula

def cal_sequence(flag = -1):
    # flagで分岐
    if flag < 0:
        flag = random.randrange(2)
    if flag == 0:   # 等比数列の和
        a = random.randrange(2, 11)
        r = random.randrange(2, 4)
        n = random.randrange(2, 5)
        solution = int(a*(r**n - 1)/(r - 1))
        formula = f"\\displaystyle {a}\\sum_{{k=0}}^{n-1} {r}^n"
    else:
        a = random.randrange(1, 11)
        d = random.randrange(2, 4)
        n = random.randrange(2, 5)
        solution = int((n + 1)*(2*a + n*d)/2)
        formula = f"\\displaystyle \\sum_{{k=0}}^{n} ({d}n + {a})"
    return solution, formula

def cal_floor_ceil(flag = -1):
    tuple_dic = {0: (math.e, "e"), 1:(math.pi, "\\pi"), 2:(math.sqrt(2), "\\sqrt{2}")}
    index = random.randrange(3)
    x_float, x_str = tuple_dic[index]
    minus_flag = random.choice([-1, 1])
    if minus_flag < 0:
        x_float = -x_float
        x_str = "-" + x_str
    if flag < 0:
        flag = random.randrange(3)
    if flag == 0:
        solution = math.ceil(x_float)
        formula = f"\\lceil {x_str} \\rceil"
    elif flag == 1:
        solution = math.floor(x_float)
        formula = f"\\lfloor {x_str} \\rfloor"
    else:
        solution = math.floor(x_float)
        formula = f"[ {x_str} ]"
    return solution, formula

def cal_det(flag = -1):  # 行列式の出力    # flagで分岐
    if flag < 0:
        flag = random.randrange(2)
    if flag == 0:
        a_11 = random.randrange(9)
        a_12 = random.randrange(9)
        a_21 = random.randrange(9)
        a_22 = random.randrange(9)
        det = a_11*a_22 - a_12*a_21
        solution = det
        formula = f"\\begin{{vmatrix}} {a_11} & {a_12} \\\\ {a_21} &  {a_22} \\end{{vmatrix}}"
    else:
        a = np.random.randint(1, 4, size=(3, 3))
        for k in range(random.randrange(1, 3)):
            i, j = np.random.randint(0, 3, size=2)
            a[i, j] = 0
        solution = int(np.linalg.det(a))
        formula = "\\begin{vmatrix}" + "\\\\".join("&".join(str(a[i, j]) for j in range(3)) for i in range(3)) + "\\end{vmatrix}"
    return solution, formula
