import re
import sys

def fix_java_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Regex pattern to match `xml.parseXXXAttr("...", x -> abc = x);`
    pattern = re.compile(r'xml\.parse(\w+)Attr\("([^"]+)",\s*x\s*->\s*(\w+)\s*=\s*x\);')

    # Replacement format: `abc = xml.parseXXXAttr("...", abc);`
    fixed_content = pattern.sub(r'\3 = xml.parse\1Attr("\2", \3);', content)

    # Write the fixed content back
    with open(filename, 'w') as f:
        f.write(fixed_content)

    print(f"Fixed: {filename}")

# Read file names from command-line arguments
if len(sys.argv) < 2:
    print("Usage: python fix_java.py <file1> <file2> ...")
else:
    for file in sys.argv[1:]:
        fix_java_file(file)

