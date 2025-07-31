export const typeMapper = {
  integer: {
    python: "int",
    java: "int",
    cpp: "int",
    rust: "i32",
    go: "int",
    typescript: "number"
  },
  float: {
    python: "float",
    java: "double",
    cpp: "double",
    rust: "f64",
    go: "float64",
    typescript: "number"
  },
  string: {
    python: "str",
    java: "String",
    cpp: "std::string",
    rust: "String",
    go: "string",
    typescript: "string"
  },
  boolean: {
    python: "bool",
    java: "boolean",
    cpp: "bool",
    rust: "bool",
    go: "bool",
    typescript: "boolean"
  },
  hashmap: {
    python: "dict",
    java: "Map<K,V>",
    cpp: "std::unordered_map<K,V>",
    rust: "HashMap<K,V>",
    go: "map[K]V",
    typescript: "Map<K,V>"
  },
  array_integer: {
    python: "list[int]",
    java: "int[]",
    cpp: "std::vector<int>",
    rust: "Vec<i32>",
    go: "[]int",
    typescript: "number[]"
  },
  array_float: {
    python: "list[float]",
    java: "double[]",
    cpp: "std::vector<double>",
    rust: "Vec<f64>",
    go: "[]float64",
    typescript: "number[]"
  },
  array_string: {
    python: "list[str]",
    java: "String[]",
    cpp: "std::vector<std::string>",
    rust: "Vec<String>",
    go: "[]string",
    typescript: "string[]"
  },
  array_boolean: {
    python: "list[bool]",
    java: "boolean[]",
    cpp: "std::vector<bool>",
    rust: "Vec<bool>",
    go: "[]bool",
    typescript: "boolean[]"
  }
};

export function getConcreteType(
  abstractType: keyof typeof typeMapper,
  language: keyof (typeof typeMapper)["integer"]
): string {
  return typeMapper[abstractType]?.[language] || "unknown";
}
