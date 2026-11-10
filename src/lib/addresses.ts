/** A shopper's saved addresses, from customer-svc (`/customer/me/address`). The shopper is identified by their token, never by an id. */
import { store } from "./platform";

export type SavedAddress = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type PAddress = Omit<SavedAddress, "id"> & { id: number };

const shape = (a: PAddress): SavedAddress => ({ ...a, id: String(a.id) });

export async function listAddresses(token: string): Promise<SavedAddress[]> {
  return (await store<PAddress[]>("/customer-svc/customer/me/address", { token })).map(shape);
}

export type AddressInput = Omit<SavedAddress, "id">;

export async function createAddress(token: string, a: AddressInput) {
  return shape(await store<PAddress>("/customer-svc/customer/me/address", { method: "POST", token, body: a }));
}

export async function updateAddress(token: string, id: string, a: AddressInput) {
  return shape(await store<PAddress>(`/customer-svc/customer/me/address/${encodeURIComponent(id)}`, { method: "PUT", token, body: a }));
}

export async function deleteAddress(token: string, id: string) {
  await store(`/customer-svc/customer/me/address/${encodeURIComponent(id)}`, { method: "DELETE", token });
}
