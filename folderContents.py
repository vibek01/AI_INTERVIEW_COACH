import os

def extract_file_contents(root_dir, output_filename="extracted_contents.txt"):
    """
    Extracts the contents of files in the given directory,
    excluding specified directories and files, and saves them to an output file.
    """
    excluded_dirs = ["node_modules", ".git"]
    excluded_files = [".gitignore", "package-lock.json", "postcss.config.js",
                      "tailwind.config.js", "tsconfig.app.json", "tsconfig.json",
                      "folderContents.py", "folderStructure.py", "folder_tree.txt", "extracted_contents.txt"] # Add any other files you want to exclude

    with open(output_filename, "w", encoding="utf-8") as outfile:
        for dirpath, dirnames, filenames in os.walk(root_dir):
            # Exclude specified directories from traversal
            dirnames[:] = [d for d in dirnames if d not in excluded_dirs]

            for filename in filenames:
                if filename in excluded_files:
                    continue

                filepath = os.path.join(dirpath, filename)
                try:
                    with open(filepath, "r", encoding="utf-8") as infile:
                        outfile.write(f"--- File: {filepath} ---\n")
                        outfile.write(infile.read())
                        outfile.write("\n\n")
                except Exception as e:
                    print(f"Could not read {filepath}: {e}")

if __name__ == "__main__":
    current_directory = "."  # Use the current directory where the script is run
    extract_file_contents(current_directory)
    print("File contents extracted to extracted_contents.txt")