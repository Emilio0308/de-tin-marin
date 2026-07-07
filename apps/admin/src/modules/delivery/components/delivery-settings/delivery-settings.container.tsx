"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@de-tin-marin/ui/button";
import { Input } from "@de-tin-marin/ui/input";
import { Label } from "@de-tin-marin/ui/label";
import {
  deleteDeliveryZoneAction,
  getDeliverySettingsAction,
  listDeliveryZonesAction,
  updateDeliverySettingsAction,
  upsertDeliveryZoneAction,
} from "@/modules/delivery/actions/delivery.actions";

export function DeliverySettingsContainer() {
  const queryClient = useQueryClient();
  const [zoneDraft, setZoneDraft] = useState({
    district: "",
    fee: 0,
    sortOrder: 0,
  });

  const zonesQuery = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const result = await listDeliveryZonesAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const settingsQuery = useQuery({
    queryKey: ["delivery-settings"],
    queryFn: async () => {
      const result = await getDeliverySettingsAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  const [settingsDraft, setSettingsDraft] = useState({
    pickupEnabled: true,
    deliveryEnabled: true,
    fallbackFee: 20,
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setSettingsDraft(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const result = await updateDeliverySettingsAction(settingsDraft);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["delivery-settings"] });
    },
  });

  const saveZoneMutation = useMutation({
    mutationFn: async () => {
      const result = await upsertDeliveryZoneAction({
        district: zoneDraft.district,
        fee: zoneDraft.fee,
        sortOrder: zoneDraft.sortOrder,
        isActive: true,
      });
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      setZoneDraft({ district: "", fee: 0, sortOrder: 0 });
      await queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteDeliveryZoneAction(id);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    },
  });

  if (zonesQuery.isLoading || settingsQuery.isLoading) {
    return <p className="p-8 text-sm text-zinc-500">Cargando delivery…</p>;
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Delivery — Piura</h1>
        <p className="text-zinc-600">
          Tarifas por distrito y configuración global
        </p>
      </div>

      <section className="grid max-w-xl gap-4 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Configuración global</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settingsDraft.pickupEnabled}
            onChange={(event) =>
              setSettingsDraft((current) => ({
                ...current,
                pickupEnabled: event.target.checked,
              }))
            }
          />
          Recojo en tienda habilitado
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settingsDraft.deliveryEnabled}
            onChange={(event) =>
              setSettingsDraft((current) => ({
                ...current,
                deliveryEnabled: event.target.checked,
              }))
            }
          />
          Delivery habilitado
        </label>
        <div>
          <Label>Tarifa fallback (distrito no listado)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={settingsDraft.fallbackFee}
            onChange={(event) =>
              setSettingsDraft((current) => ({
                ...current,
                fallbackFee: Number(event.target.value) || 0,
              }))
            }
          />
        </div>
        <Button
          disabled={saveSettingsMutation.isPending}
          onClick={() => saveSettingsMutation.mutate()}
        >
          Guardar configuración
        </Button>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Distritos</h2>
        <div className="grid max-w-xl gap-3 rounded-lg border p-4 md:grid-cols-3">
          <Input
            placeholder="Distrito"
            value={zoneDraft.district}
            onChange={(event) =>
              setZoneDraft((current) => ({
                ...current,
                district: event.target.value,
              }))
            }
          />
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="Tarifa S/"
            value={zoneDraft.fee}
            onChange={(event) =>
              setZoneDraft((current) => ({
                ...current,
                fee: Number(event.target.value) || 0,
              }))
            }
          />
          <Button
            disabled={!zoneDraft.district || saveZoneMutation.isPending}
            onClick={() => saveZoneMutation.mutate()}
          >
            Agregar distrito
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left">
              <tr>
                <th className="px-4 py-3">Distrito</th>
                <th className="px-4 py-3">Tarifa</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(zonesQuery.data ?? []).map((zone) => (
                <tr key={zone.id} className="border-t">
                  <td className="px-4 py-3">{zone.district}</td>
                  <td className="px-4 py-3">S/ {zone.fee.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="secondary"
                      disabled={deleteZoneMutation.isPending}
                      onClick={() => deleteZoneMutation.mutate(zone.id)}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
