const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const root = path.join(__dirname, "../..");

require.extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, filename);
};

// A small hook harness exercises the actual route callbacks and provider/reducer.
// It does not simulate native layout, gestures, or React scheduling.
function mount(file, { params = {}, context, router = {}, globals = {}, props = {}, navigation = {}, dependencies = {} } = {}) {
  const slots = [];
  let cursor = 0;
  const focus = [];
  const effects = [];
  const hardwareBack = [];
  const effect = (fn, deps) => { const index = cursor++; if (!slots[index] || deps.some((dep, i) => dep !== slots[index][i])) { slots[index] = deps; effects.push(fn); } };
  const mocks = {
    react: { ...React,
      useState: (initial) => {
        const index = cursor++;
        if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
        return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
      },
      useRef: (initial) => {
        const index = cursor++;
        return slots[index] ?? (slots[index] = { current: initial });
      },
      useReducer: (reducer, initial) => {
        const index = cursor++;
        slots[index] ??= initial;
        return [slots[index], (action) => { slots[index] = reducer(slots[index], action); }];
      },
      useEffect: effect, useLayoutEffect: effect,
      useMemo: (fn) => fn(), useCallback: (fn) => fn,
    },
    "expo-router": { useNavigation: () => navigation, useLocalSearchParams: () => params, useRouter: () => router,
      useFocusEffect: (fn) => { focus.push(fn); } },
    "react-native": { StyleSheet: { create: (styles) => styles },
      BackHandler: { addEventListener: (_event, fn) => { hardwareBack.push(fn); return { remove() {} }; } },
      Alert: { alert() {} }, Keyboard: { dismiss() {} }, useWindowDimensions: () => ({ width: 320, fontScale: 1 }),
      Platform: { OS: "android" }, Modal: "Modal", KeyboardAvoidingView: "KeyboardAvoidingView",
      View: "View", Text: "Text", TouchableOpacity: "TouchableOpacity",
      ScrollView: "ScrollView", FlatList: "FlatList", ActivityIndicator: "ActivityIndicator" },
    "@expo/vector-icons": { Ionicons: "Icon" },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    "@/constants/theme": { colors: {}, spacing: {}, dimensions: {}, radii: {}, shadows: {}, typography: {}, interaction: {},
      getTabBarClearance: () => 100 },
    "@/context/CatDataContext": { useCatData: () => context() },
    ...dependencies,
  };
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, { exports, setTimeout, clearTimeout, ...globals, require: (id) => {
    if (id in mocks) return mocks[id];
    if (id === "react/jsx-runtime") return require(id);
    if (id.includes("components/") || (file.startsWith("components/") && id.startsWith("./"))) return { __esModule: true, default: id };
    if (id.startsWith("@/")) return require(path.join(root, id.slice(2)) + ".ts");
    if (id.startsWith("./")) return require(path.join(path.dirname(path.join(root, file)), id) + ".ts");
    throw new Error("Unexpected dependency: " + id);
  } }, { filename: file });
  return { render: () => { cursor = 0; focus.length = 0; const tree = (exports.default ?? exports.CatDataProvider ?? exports.AuthProvider)({ children: null, ...props }); effects.splice(0).forEach((fn) => fn()); return tree; }, focus, hardwareBack };
}

function nodes(node) {
  return [node, ...React.Children.toArray(node?.props?.children).flatMap(nodes)];
}
function find(tree, name) {
  return nodes(tree).find((node) => typeof node.type === "string" && node.type.endsWith(name));
}
function modal(tree, title) {
  return nodes(tree).find((node) => node.props?.title?.startsWith(title));
}
function store() {
  const provider = mount("context/CatDataContext.tsx");
  return () => provider.render().props.value;
}


module.exports = { mount, nodes, find, modal, store };
