import sys
import re

def parse_variable_declarations(java_code):
    """Extracts variable declarations of types double, int, boolean, or String."""
    var_types = {}
    pattern = re.compile(r'\b(double|int|boolean|String)\s+([\w, ]+);')

    for match in pattern.finditer(java_code):
        var_type, var_names = match.groups()
        for var in var_names.split(','):
            var = var.strip()
            if var:
                var_types[var] = var_type

    return var_types

def find_dump_variables(java_code):
    """Finds variables used in return statement of dump() function."""
    dump_pattern = re.compile(r'return\s+super\.dump\(\)\s*\+([^;]+);', re.DOTALL)
    match = dump_pattern.search(java_code)

    if not match:
        return []

    dump_line = match.group(1)
    variables = re.findall(r'\b\w+\b', dump_line)
    return [var for var in variables if var != "super" and var != "dump"]

def generate_dump_xml(dump_vars, var_types):
    """Generates the dumpXml() function."""
    function_lines = [
        "    void dumpXml(Document doc, Element elem) {",
        "        super.dumpXml(doc, elem);"
    ]

    for var in dump_vars:
        if var in var_types:
            prefix = var[:2]  # First two letters of variable name
            function_lines.append(f'        XMLSerializer.dumpAttr(elem, "{prefix}", {var});')

    function_lines.append("    }")
    return "\n".join(function_lines)

def generate_undump_xml(dump_vars, var_types):
    """Generates the undumpXml() function."""
    function_lines = [
        "    void undumpXml(XMLDeserializer xml) {",
        "        super.undumpXml(xml);"
    ]

    type_map = {"double": "Double", "int": "Int", "boolean": "Boolean", "String": "String"}

    for var in dump_vars:
        if var in var_types:
            prefix = var[:2]  # First two letters of variable name
            type_str = type_map[var_types[var]]  # Convert type to correct method suffix
            function_lines.append(f'        {var} = xml.parse{type_str}Attr("{prefix}", {var});')

    function_lines.append("    }")
    return "\n".join(function_lines)

def insert_functions(java_code, dump_xml, undump_xml):
    """Inserts import statements after the package declaration and adds dumpXml() and undumpXml() after the dump() function."""
    
    # Insert imports after the package statement
    package_pattern = re.compile(r'^(package\s+[\w.]+;\s*)', re.MULTILINE)
    import_statements = "import com.google.gwt.xml.client.Element;\nimport com.google.gwt.xml.client.Document;\n\n"

    if package_match := package_pattern.search(java_code):
        java_code = java_code[:package_match.end()] + import_statements + java_code[package_match.end():]

    # Find the dump() function and insert the new functions after it
    dump_function_pattern = re.compile(r'(String dump\(\)\s*{[^}]+})', re.DOTALL)
    match = dump_function_pattern.search(java_code)

    if not match:
        return java_code  # No changes if dump() is missing

    # Insert the new functions right after the dump() function
    modified_code = java_code[:match.end()] + "\n\n" + dump_xml + "\n\n" + undump_xml + java_code[match.end():]
    return modified_code

def main():
    if len(sys.argv) < 2:
        print("Usage: python script.py <filename>")
        return

    filename = sys.argv[1]

    try:
        with open(filename, 'r') as f:
            java_code = f.read()

        var_types = parse_variable_declarations(java_code)
        dump_vars = find_dump_variables(java_code)

        if dump_vars:
            dump_xml = generate_dump_xml(dump_vars, var_types)
            undump_xml = generate_undump_xml(dump_vars, var_types)
            modified_code = insert_functions(java_code, dump_xml, undump_xml)

            with open(filename, 'w') as f:
                f.write(modified_code)
        else:
            print("No dump() return statement found.")

    except FileNotFoundError:
        print(f"Error: File '{filename}' not found.")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()
