import { apiFetch } from "./api";
import type {
  Cat,
  CatChanges,
  CatGender,
} from "../types/models";
import { getAgeYears } from "../utils/date";

interface BackendCat {
  cat_id: string;
  profile_id: string;
  name: string;
  breed: string | null;
  sex: string | null;
  age: number | null;
  birthdate: string | null;
  description: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface CatsResponse {
  cats: BackendCat[];
}

interface CatResponse {
  cat: BackendCat;
}

// ============================================================
// HELPERS
// ============================================================

function mapGender(value: string | null): CatGender {
  return value === "Female" ? "Female" : "Male";
}

function mapBackendCat(cat: BackendCat): Cat {
  return {
    id: cat.cat_id,
    name: cat.name,
    breed: cat.breed ?? null,
    gender: mapGender(cat.sex),
    birthdate: cat.birthdate
      ? cat.birthdate.slice(0, 10)
      : "",
    description: cat.description ?? null,
    photoUri: cat.profile_image_url ?? null,
    coverUri: cat.cover_image_url ?? null,
  };
}

async function getErrorMessage(
  response: Response
): Promise<string> {
  try {
    const data = await response.json();

    if (data && typeof data.error === "string") {
      return data.error;
    }
  } catch {
    // Ignore JSON parsing failure.
  }

  return `Request failed (${response.status})`;
}

// ============================================================
// IMAGE HELPERS
// ============================================================

function isLocalImage(uri: string | null | undefined): boolean {
  if (!uri) return false;

  return !/^https?:\/\//i.test(uri);
}

function appendImage(
  formData: FormData,
  fieldName: string,
  imageUri: string
): void {
  const filename =
    imageUri.split("/").pop()?.split("?")[0] ||
    `${fieldName}.jpg`;

  const extension =
    filename.split(".").pop()?.toLowerCase();

  const mimeType =
    extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : "image/jpeg";

  formData.append(fieldName, {
    uri: imageUri,
    name: filename,
    type: mimeType,
  } as any);
}

function appendField(
  formData: FormData,
  key: string,
  value: string | null | undefined
): void {
  if (value !== undefined) {
    formData.append(key, value ?? "");
  }
}

// ============================================================
// FETCH CATS
// ============================================================

export async function fetchCats(): Promise<Cat[]> {
  const response = await apiFetch("/api/cats");

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as CatsResponse;

  return data.cats.map(mapBackendCat);
}

// ============================================================
// CREATE CAT
// ============================================================

export async function createCat(cat: Cat): Promise<Cat> {
  const formData = new FormData();

  formData.append("name", cat.name);
  formData.append("sex", cat.gender);
  formData.append("birthdate", cat.birthdate);
  formData.append(
    "age",
    String(getAgeYears(cat.birthdate))
  );

  appendField(formData, "breed", cat.breed);
  appendField(formData, "description", cat.description);

  if (cat.photoUri && isLocalImage(cat.photoUri)) {
    appendImage(
      formData,
      "profile_image",
      cat.photoUri
    );
  }

  if (cat.coverUri && isLocalImage(cat.coverUri)) {
    appendImage(
      formData,
      "cover_image",
      cat.coverUri
    );
  }

  const response = await apiFetch("/api/cats", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as CatResponse;

  return mapBackendCat(data.cat);
}

// ============================================================
// UPDATE CAT
// ============================================================

export async function updateCat(
  catId: string,
  changes: CatChanges
): Promise<Cat> {
  const hasProfileImage = isLocalImage(changes.photoUri);
  const hasCoverImage = isLocalImage(changes.coverUri);

  const body: Record<string, string> = {};

  if (changes.name !== undefined) {
    body.name = changes.name;
  }

  if (changes.breed !== undefined) {
    body.breed = changes.breed ?? "";
  }

  if (changes.gender !== undefined) {
    body.sex = changes.gender;
  }

  if (changes.birthdate !== undefined) {
    body.birthdate = changes.birthdate;
    body.age = String(
      getAgeYears(changes.birthdate)
    );
  }

  if (changes.description !== undefined) {
    body.description = changes.description ?? "";
  }

  let response: Response;

  // Image update: use multipart FormData.
  if (hasProfileImage || hasCoverImage) {
    const formData = new FormData();

    Object.entries(body).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (hasProfileImage && changes.photoUri) {
      appendImage(
        formData,
        "profile_image",
        changes.photoUri
      );
    }

    if (hasCoverImage && changes.coverUri) {
      appendImage(
        formData,
        "cover_image",
        changes.coverUri
      );
    }

    response = await apiFetch(
      `/api/cats/${catId}`,
      {
        method: "PUT",
        body: formData,
      }
    );
  } else {
    // Text-only update: use JSON.
    response = await apiFetch(
      `/api/cats/${catId}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      }
    );
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as CatResponse;

  return mapBackendCat(data.cat);
}

// ============================================================
// DELETE CAT
// ============================================================

export async function deleteCat(
  catId: string
): Promise<void> {
  const response = await apiFetch(
    `/api/cats/${catId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}