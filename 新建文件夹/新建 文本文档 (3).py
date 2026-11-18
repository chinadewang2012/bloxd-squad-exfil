import tkinter as tk
from tkinter import filedialog, colorchooser

def open_file():
    file_path = filedialog.askopenfilename(filetypes=[("文本文件", "*.txt")])
    if file_path:
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
                text.delete('1.0', tk.END)
                text.insert(tk.END, content)
        except Exception as e:
            print(f"读取文件时出错: {e}")

def change_background_color():
    color = colorchooser.askcolor()[1]
    if color:
        text.config(bg=color)

def change_font_color():
    color = colorchooser.askcolor()[1]
    if color:
        text.config(fg=color)

def change_font_size():
    try:
        size = int(entry_size.get())
        font = (text.cget("font").split()[0], size)
        text.config(font=font)
    except ValueError:
        print("请输入有效的数字作为字号")

def change_font_family():
    family = var_font.get()
    size = text.cget("font").split()[1]
    font = (family, size)
    text.config(font=font)

def hide_window():
    root.withdraw()

def show_window():
    root.deiconify()

root = tk.Tk()
root.title("隐藏看小说软件")

# 创建菜单栏
menu_bar = tk.Menu(root)
file_menu = tk.Menu(menu_bar, tearoff=0)
file_menu.add_command(label="打开文件", command=open_file)
file_menu.add_separator()
file_menu.add_command(label="退出", command=root.quit)
menu_bar.add_cascade(label="文件", menu=file_menu)

format_menu = tk.Menu(menu_bar, tearoff=0)
format_menu.add_command(label="背景颜色", command=change_background_color)
format_menu.add_command(label="字体颜色", command=change_font_color)
format_menu.add_cascade(label="字体", menu=tk.Menu(format_menu, tearoff=0))
format_menu.add_command(label="字号", command=change_font_size)
menu_bar.add_cascade(label="格式", menu=format_menu)

hide_menu = tk.Menu(menu_bar, tearoff=0)
hide_menu.add_command(label="隐藏窗口", command=hide_window)
hide_menu.add_command(label="显示窗口", command=show_window)
menu_bar.add_cascade(label="窗口", menu=hide_menu)

root.config(menu=menu_bar)

# 创建文本显示区域
text = tk.Text(root, wrap=tk.WORD, font=("Arial", 12))
text.pack(fill=tk.BOTH, expand=True)

# 创建字体选择框
fonts = ["Arial", "Times New Roman", "Courier New"]
var_font = tk.StringVar(root)
var_font.set(fonts[0])
font_menu = tk.OptionMenu(root, var_font, *fonts, command=lambda _: change_font_family())
font_menu.pack(side=tk.LEFT)

# 创建字号输入框
label_size = tk.Label(root, text="字号:")
label_size.pack(side=tk.LEFT)
entry_size = tk.Entry(root, width=5)
entry_size.insert(0, "12")
entry_size.pack(side=tk.LEFT)
button_size = tk.Button(root, text="更改", command=change_font_size)
button_size.pack(side=tk.LEFT)

root.mainloop()