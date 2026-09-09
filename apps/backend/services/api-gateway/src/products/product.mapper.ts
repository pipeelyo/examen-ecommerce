export interface CatalogProductRecord {
  id: string;
  name: string;
  unitPrice: number;
  categoryName: string;
  stock: number;
}

export interface ProductDto {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

/**
 * catalog-service guarda el nombre de categoria sin tilde ("Tecnologia")
 * porque asi lo compara internamente discount-service (TECH_CATEGORY). El
 * CONTRACT.md del front exige la version con tilde solo para mostrar.
 */
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  Tecnologia: "Tecnología",
  Jugueteria: "Juguetería",
};

function displayCategoryName(categoryName: string): string {
  return CATEGORY_DISPLAY_NAMES[categoryName] ?? categoryName;
}

export function toProductDto(record: CatalogProductRecord): ProductDto {
  return {
    id: record.id,
    name: record.name,
    category: displayCategoryName(record.categoryName),
    price: record.unitPrice,
    stock: record.stock,
  };
}
