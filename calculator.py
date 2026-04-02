import tkinter as tk

def btn_click(item):
    current = display_var.get()
    
    # Clear "Error" text if present
    if current == "Error":
        current = ""
        
    display_var.set(current + str(item))

def btn_clear():
    display_var.set("")

def btn_equal():
    try:
        # Evaluate the math expression
        result = str(eval(display_var.get()))
        display_var.set(result)
    except Exception as e:
        display_var.set("Error")

# Main window setup
root = tk.Tk()
root.title("Calculator")
root.geometry("320x420")
root.resizable(0, 0) # Prevent resizing

# Display setup
display_var = tk.StringVar()
display = tk.Entry(root, textvariable=display_var, font=('Arial', 24, 'bold'), bg="#ffffff", fg="#000000", bd=5, justify="right")
display.pack(fill=tk.BOTH, ipadx=8, ipady=20, padx=10, pady=10)

# Button frame setup
btn_frame = tk.Frame(root)
btn_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 10))

# Button definitions
buttons = [
    ('7', 0, 0), ('8', 0, 1), ('9', 0, 2), ('/', 0, 3),
    ('4', 1, 0), ('5', 1, 1), ('6', 1, 2), ('*', 1, 3),
    ('1', 2, 0), ('2', 2, 1), ('3', 2, 2), ('-', 2, 3),
    ('C', 3, 0), ('0', 3, 1), ('=', 3, 2), ('+', 3, 3)
]

# Adding buttons to the grid
for (text, row, col) in buttons:
    if text == '=':
        btn = tk.Button(btn_frame, text=text, font=('Arial', 18, 'bold'), bg="#4caf50", fg="white", command=btn_equal)
    elif text == 'C':
        btn = tk.Button(btn_frame, text=text, font=('Arial', 18, 'bold'), bg="#f44336", fg="white", command=btn_clear)
    elif text in ['/', '*', '-', '+']:
        btn = tk.Button(btn_frame, text=text, font=('Arial', 18, 'bold'), bg="#2196f3", fg="white", command=lambda t=text: btn_click(t))
    else:
        btn = tk.Button(btn_frame, text=text, font=('Arial', 18), bg="#e0e0e0", fg="black", command=lambda t=text: btn_click(t))
    
    btn.grid(row=row, column=col, sticky="nsew", padx=2, pady=2)

# Configuring grid weights so buttons expand to fill space
for i in range(4):
    btn_frame.rowconfigure(i, weight=1)
    btn_frame.columnconfigure(i, weight=1)

# Run the app
root.mainloop()
