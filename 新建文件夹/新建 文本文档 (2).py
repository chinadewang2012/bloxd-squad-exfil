def calculate_abs_sum(x, y, z):
    if x >= z and x >= -y:
        return 2 * x + y - z
    elif x >= z and x < -y:
        return -y - z
    elif x < z and x >= -y:
        return y + z
    else:
        return -2 * x - y + z

# 示例输入
x = 3
y = -2
z = 1

# 调用函数计算结果
result = calculate_abs_sum(x, y, z)
print(f"当 x = {x}, y = {y}, z = {z} 时，|x + y| + |x - z| 的值为: {result}")