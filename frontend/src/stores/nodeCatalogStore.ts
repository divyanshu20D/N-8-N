import { create } from "zustand";
import type { NodeTypeDefinition } from "../types/workflow";
import type { ConfigField } from "../utils/nodeConfigSchemas";
import { api } from "../utils/api";
import { NODE_TYPES as FALLBACK_NODE_TYPES } from "../utils/nodeRegistry";
import { NODE_CONFIG_SCHEMAS as FALLBACK_NODE_SCHEMAS } from "../utils/nodeConfigSchemas";

interface NodeCatalogStore {
  nodeTypes: NodeTypeDefinition[];
  nodeConfigSchemas: Record<string, ConfigField[]>;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  loadCatalog: () => Promise<void>;
}

export const useNodeCatalogStore = create<NodeCatalogStore>((set, get) => ({
  nodeTypes: FALLBACK_NODE_TYPES,
  nodeConfigSchemas: FALLBACK_NODE_SCHEMAS,
  isLoaded: false,
  isLoading: false,
  error: null,
  loadCatalog: async () => {
    if (get().isLoading || get().isLoaded) return;
    set({ isLoading: true, error: null });

    try {
      const [typesRes, schemasRes] = await Promise.all([
        api.get<NodeTypeDefinition[]>("/nodes/types"),
        api.get<Record<string, ConfigField[]>>("/nodes/schemas"),
      ]);

      set({
        nodeTypes: typesRes.data,
        nodeConfigSchemas: schemasRes.data,
        isLoaded: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error:
          error?.response?.data?.message ??
          "Unable to fetch node catalog, using defaults",
      });
    }
  },
}));
