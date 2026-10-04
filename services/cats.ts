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
  created_at: string | null;
  updated_at: string | null;
}

interface CatsResponse {
  cats: BackendCat[];
}

interface CatResponse {
  cat: BackendCat;
}

function mapGender(value: string | null): CatGender {
  return value === "Female" ? "Female" : "Male";
}

function mapBackendCat(cat: BackendCat): Cat {
  return {
    id: cat.cat_id,
    name: cat.name,
    gender: mapGender(cat.sex),
    birthdate: cat.birthdate
      ? cat.birthdate.slice(0, 10)
      : "",
    photoUri: cat.profile_image_url ?? null,
    coverUri: cat.profile_image_url ?? null,
  };
}

async function getErrorMessage(
  response: Response
): Promise<string> {
  try {
    const data = await response.json();

    if (
      data &&
      typeof data.error === "string"
    ) {
      return data.error;
    }
  } catch {
    // Ignore JSON parsing failure.
  }

  return `Request failed (${response.status})`;
}

export async function fetchCats(): Promise<Cat[]> {
  const response = await apiFetch("/api/cats");

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  const data =
    (await response.json()) as CatsResponse;

  return data.cats.map(mapBackendCat);
}

export async function createCat(
  cat: Cat
): Promise<Cat> {
  const response = await apiFetch("/api/cats", {
    method: "POST",
    body: JSON.stringify({
      name: cat.name,
      sex: cat.gender,
      birthdate: cat.birthdate,
      age: getAgeYears(cat.birthdate),
    }),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  const data =
    (await response.json()) as CatResponse;

  return mapBackendCat(data.cat);
}

export async function updateCat(
  catId: string,
  changes: CatChanges
): Promise<Cat> {
  const body: Record<string, unknown> = {};

  if (changes.name !== undefined) {
    body.name = changes.name;
  }

  if (changes.gender !== undefined) {
    body.sex = changes.gender;
  }

  if (changes.birthdate !== undefined) {
    body.birthdate = changes.birthdate;
    body.age = getAgeYears(
      changes.birthdate
    );
  }

  const response = await apiFetch(
    `/api/cats/${catId}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response)
    );
  }

  const data =
    (await response.json()) as CatResponse;

  return mapBackendCat(data.cat);
}

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
    throw new Error(
      await getErrorMessage(response)
    );
  }
}