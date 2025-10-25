import os

def generate_tree_structure(root_dir, output_filename="folder_tree.txt"):
    """
    Generates a tree-like structure of the given directory,
    excluding specified directories and files, and saves it to an output file.
    """
    excluded_dirs = ["node_modules", ".git"]
    excluded_files = [".gitignore", ".env", "package-lock.json", "postcss.config.js",
                      "tailwind.config.js", "tsconfig.app.json", "tsconfig.json",
                      "tsconfig.node.json", "vite.config.ts", "eslint.config.js",
                      "index.html"] # Add any other files you want to exclude

    with open(output_filename, "w", encoding="utf-8") as outfile:
        outfile.write(f"{os.path.basename(os.path.abspath(root_dir))}/\n")
        for dirpath, dirnames, filenames in os.walk(root_dir):
            # Exclude specified directories from traversal
            dirnames[:] = [d for d in dirnames if d not in excluded_dirs]

            level = dirpath.replace(root_dir, '').count(os.sep)
            indent = '│   ' * level
            indent_files = '│   ' * (level + 1)

            # Print directories
            for dname in sorted(dirnames):
                outfile.write(f"{indent}├── {dname}/\n")

            # Print files
            for fname in sorted(filenames):
                if fname not in excluded_files:
                    outfile.write(f"{indent_files}├── {fname}\n")

if __name__ == "__main__":
    current_directory = "."  # Use the current directory where the script is run
    generate_tree_structure(current_directory)
    print("Folder tree structure generated to folder_tree.txt")