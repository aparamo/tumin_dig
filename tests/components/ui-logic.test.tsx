import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecipientCard } from "@/components/screens/Pagar";
import { buildDefaults, contactToMember } from "@/components/screens/Directorio";
import { productCreateSchema } from "@/lib/schemas/product";
import { renderWithProviders } from "../helpers/render";

vi.mock("@/lib/trpc/react", () => {
  const noop = () => ({ data: undefined, isLoading: false, mutate: vi.fn(), mutateAsync: vi.fn() });
  return {
    trpc: {
      useUtils: () => ({
        wallet: { getBalance: { invalidate: vi.fn() }, getHistory: { invalidate: vi.fn() } },
      }),
      user: { searchByDato: { useQuery: () => ({ data: undefined, isLoading: false }) } },
      wallet: { sendTumin: { useMutation: noop } },
      bazar: {
        getMyProducts: { useQuery: () => ({ data: [], isLoading: false }) },
        createProduct: { useMutation: noop },
        updateProduct: { useMutation: noop },
        deleteProduct: { useMutation: noop },
        toggleIsStarred: { useMutation: noop },
        updateProductStatus: { useMutation: noop },
        toggleShowInProfile: { useMutation: noop },
      },
      passwordReset: {
        request: { useMutation: noop },
        confirm: { useMutation: noop },
      },
      directory: {
        listSavedContacts: { useQuery: () => ({ data: { items: [] }, isLoading: false }) },
        listMembers: { useQuery: () => ({ data: { items: [], nextCursor: undefined }, isLoading: false }) },
      },
    },
  };
});

describe("RecipientCard", () => {
  it("shows can-receive state", () => {
    render(
      <RecipientCard
        name="Ana Pérez"
        publicName={null}
        avatarUrl={null}
        status="ACTIVO"
        hasActiveProduct
        isSelf={false}
      />
    );
    expect(screen.getByText(/Puede recibir Túmin/i)).toBeInTheDocument();
    expect(screen.getByText("AP")).toBeInTheDocument();
  });

  it("shows frozen / self / no-product branches", () => {
    const { rerender } = render(
      <RecipientCard
        name="Bob"
        publicName={null}
        avatarUrl={null}
        status="CONGELADO"
        hasActiveProduct
        isSelf={false}
      />
    );
    expect(screen.getByText(/congelada/i)).toBeInTheDocument();

    rerender(
      <RecipientCard
        name="Bob"
        publicName={null}
        avatarUrl={null}
        status="ACTIVO"
        hasActiveProduct
        isSelf
      />
    );
    expect(screen.getByText(/ti mismo/i)).toBeInTheDocument();

    rerender(
      <RecipientCard
        name="Bob"
        publicName={null}
        avatarUrl={null}
        status="ACTIVO"
        hasActiveProduct={false}
        isSelf={false}
      />
    );
    expect(screen.getByText(/Sin producto activo/i)).toBeInTheDocument();
  });
});

describe("Directorio helpers", () => {
  it("buildDefaults returns expected filter state", () => {
    expect(buildDefaults()).toMatchObject({
      search: "",
      region: "Todas",
      pageSize: 10,
      viewMode: "card",
    });
  });

  it("contactToMember maps saved contact fields", () => {
    const member = contactToMember({
      id: "sc1",
      contactUserId: "u1",
      displayName: "Carla",
      avatarUrl: null,
      isVerified: true,
      region: "Túmin Totonacapan",
      location: "Xalapa",
      locationCompact: "Xalapa",
      categories: ["Alimentos"],
      starProducts: [],
      phone: null,
      email: null,
      available: true,
      createdAt: new Date(),
    });
    expect(member.id).toBe("u1");
    expect(member.displayName).toBe("Carla");
    expect(member.isSavedContact).toBe(true);
  });
});

describe("product 10% rule (schema shared with GestionProductos)", () => {
  it("rejects under-share and accepts valid share", () => {
    expect(
      productCreateSchema.safeParse({
        name: "Bad",
        priceMxn: 95,
        priceTumin: 5,
        categories: ["Alimentos"],
      }).success
    ).toBe(false);
    expect(
      productCreateSchema.safeParse({
        name: "Good product",
        priceMxn: 90,
        priceTumin: 10,
        categories: ["Alimentos"],
      }).success
    ).toBe(true);
  });
});

describe("renderWithProviders smoke", () => {
  it("mounts FeedbackProvider without crashing", () => {
    renderWithProviders(<div>hola</div>);
    expect(screen.getByText("hola")).toBeInTheDocument();
  });
});
