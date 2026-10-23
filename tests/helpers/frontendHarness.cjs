const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const root = path.join(__dirname, "../..");

require.extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
};

// A small hook harness exercises the actual route callbacks and provider/reducer.
// It does not simulate native layout, gestures, or React scheduling.
function mount(file, { params = {}, context, router = {}, globals = {}, props = {}, navigation = { setOptions() {} }, dependencies = {} } = {}) {
  const slots = [];
  let cursor = 0;
  const focus = [];
  const effects = [];
  const cleanups = new Map();
  const hardwareBack = [];
  const effect = (fn, deps) => { const index = cursor++; if (!slots[index] || deps.some((dep, i) => dep !== slots[index][i])) { slots[index] = deps; effects.push(() => { cleanups.get(index)?.(); const cleanup = fn(); if (typeof cleanup === "function") cleanups.set(index, cleanup); else cleanups.delete(index); }); } };
  const memo = (fn, deps) => {const index=cursor++;const previous=slots[index];if(!previous || !deps || deps.some((dep,i)=>dep!==previous.deps[i]))slots[index]={deps,value:fn()};return slots[index].value;};
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
      useMemo: memo, useCallback: (fn,deps) => memo(()=>fn,deps),
    },
    "expo-router": { useNavigation: () => navigation, useLocalSearchParams: () => params, useRouter: () => router,
      useFocusEffect: (fn) => { focus.push(fn); } },
    "react-native": { StyleSheet: { create: (styles) => styles },
      BackHandler: { addEventListener: (_event, fn) => { hardwareBack.push(fn); return { remove() {} }; } },
      Alert: { alert() {} }, Keyboard: { dismiss() {} }, useWindowDimensions: () => ({ width: 320, fontScale: 1 }),
      Platform: { OS: "android" }, Modal: "Modal", KeyboardAvoidingView: "KeyboardAvoidingView",
      View: "View", Text: "Text", TouchableOpacity: "TouchableOpacity", Pressable: "Pressable",
      Image: "Image", TextInput: "TextInput",
      ScrollView: "ScrollView", FlatList: "FlatList", ActivityIndicator: "ActivityIndicator" },
    "@expo/vector-icons": { Ionicons: "Icon" },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    "@/constants/theme": { colors: {}, spacing: {}, dimensions: {}, radii: {}, shadows: {}, typography: {}, interaction: {},
      fonts: {}, fontFamily: {}, getTabBarClearance: () => 100 },
    "expo-linear-gradient": { LinearGradient: "LinearGradient" },
    "expo-image-picker": { getMediaLibraryPermissionsAsync: async () => ({ granted: true, canAskAgain: true }),
      requestMediaLibraryPermissionsAsync: async () => ({ granted: true, canAskAgain: true }),
      launchImageLibraryAsync: async () => ({ canceled: true, assets: null }) },
    "@react-native-community/datetimepicker": { __esModule: true, default: "DateTimePicker",
      DateTimePickerAndroid: { open() {} } },
    "@/services/feedback": { submitFeedback: async () => ({ ok: true }) },
    "@/hooks/useCameraTipsPreference": { useCameraTipsPreference: () => ({ enabled: true, ready: true, saving: false, error: null, setEnabled: async () => {} }) },
    "@/context/WellnessContext": { useWellnessNavigationSafety() {}, useWellness: () => ({ state:{reminders:[],checkIns:[]}, setCameraSafe() {} }) },
    "@/services/cats": {},
    "@/services/detection": require("./predictionFixture.cjs").service,
    "@/context/CatDataContext": { useCatData: () => context() },
    ...dependencies,
  };
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, { exports, setTimeout, clearTimeout, requestAnimationFrame:fn=>{fn();return 1;}, cancelAnimationFrame:()=>{}, performance, console, process: { env: {} }, ...globals, require: (id) => {
    if (id in mocks) return mocks[id];
    if (id === "react/jsx-runtime") return require(id);
    if (id.includes("components/") || (file.startsWith("components/") && id.startsWith("./"))) return { __esModule: true, default: id };
    if (id.startsWith("@/")) return require(path.join(root, id.slice(2)) + ".ts");
    if (id.startsWith("./")) return require(path.join(path.dirname(path.join(root, file)), id) + ".ts");
    throw new Error("Unexpected dependency: " + id);
  } }, { filename: file });
  return { render: () => { cursor = 0; focus.length = 0; const tree = (exports.default ?? exports.CatDataProvider ?? exports.AuthProvider)({ children: null, ...props }); effects.splice(0).forEach((fn) => fn()); return tree; }, focus, hardwareBack, unmount: () => { [...cleanups.values()].reverse().forEach(fn => fn()); cleanups.clear(); } };
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
// Route tests use the real reducer with explicit fixtures, never the production API.
// API-backed provider behavior is tested separately with injected services.
function store({emptyHistory=false}={}) {
  const { catDataReducer: reduce } = require('../../context/catDataReducer.ts');
  let state = require('./domainFixture.cjs').createState();
  if(emptyHistory){state.images=[];state.detectionRecords=[];}
  let sequence = 0;
  const dispatch = action => { state = reduce(state, action); };
  return () => ({ state, catsLoading:false, detectionsLoading:false,
    refreshData: async()=>{}, refreshCats: async()=>{}, refreshDetections: async()=>{},
    addCat: cat => { dispatch({type:'ADD_CAT',cat}); return cat; },
    updateCat: (catId,changes) => {dispatch({type:'UPDATE_CAT',catId,changes});return state.cats.find(c=>c.id===catId);},
    renameAlbum: (albumId,name)=>dispatch({type:'RENAME_ALBUM',albumId,name}),
    deleteCat: catId=>dispatch({type:'DELETE_CAT',catId}),
    deleteImage: imageId=>dispatch({type:'DELETE_IMAGE',imageId}),
    deleteImages: imageIds=>dispatch({type:'DELETE_IMAGES',imageIds}),
    resetMockData:()=>dispatch({type:'RESET_MOCK_DATA'}),
    saveCapture: input=>{const id=String(++sequence);const image={id:'test-image-'+id,albumId:input.albumId,imageUri:input.imageUri,capturedAt:input.capturedAt};
      const detection={id:'test-detection-'+id,imageId:image.id,emotion:input.emotion,confidence:input.confidence,recordedAt:input.capturedAt,catId:state.albums.find(a=>a.id===input.albumId)?.catId ?? null,imageUri:input.imageUri,isSavedToAlbum:true};
      dispatch({type:'SAVE_CAPTURE',image,detection});return {image,detection};}
  });
}


module.exports = { mount, nodes, find, modal, store };
