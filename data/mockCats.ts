import type { Cat } from "@/types/models";

// TODO(backend): replace with a real fetch (e.g. GET /cats) once the API
// is connected. Keep the Cat[] shape identical so screens don't change.
export const mockCats: Cat[] = [
  { id: "cat-julia", name: "Julia", gender: "Female", birthdate: "2021-04-12", photoUri: null, coverUri: null },
  { id: "cat-sean", name: "Sean", gender: "Male", birthdate: "2020-03-22", photoUri: null, coverUri: null },
  { id: "cat-chris", name: "Chris", gender: "Male", birthdate: "2022-08-05", photoUri: null, coverUri: null },
  { id: "cat-kiana", name: "Kiana", gender: "Female", birthdate: "2019-11-30", photoUri: null, coverUri: null },
];