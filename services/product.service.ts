// 제품 마스터 API 서비스

import type { ProductMasterItem } from "@/types/profitability";

export class ProductService {
  /**
   * 제품 목록 조회
   */
  static async fetchList(params?: {
    search?: string;
    isActive?: boolean;
  }): Promise<ProductMasterItem[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append("search", params.search);
      if (params?.isActive !== undefined)
        searchParams.append("isActive", String(params.isActive));

      const response = await fetch(`/api/products?${searchParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  /**
   * 제품 생성
   */
  static async create(product: {
    companyName: string;
    productName: string;
    unitPrice: number;
    isActive?: boolean;
  }): Promise<ProductMasterItem> {
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        throw new Error("Failed to create product");
      }

      const data = await response.json();
      return data.product;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  /**
   * 제품 수정
   */
  static async update(
    id: number,
    product: {
      companyName: string;
      productName: string;
      unitPrice: number;
      isActive?: boolean;
    }
  ): Promise<ProductMasterItem> {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      const data = await response.json();
      return data.product;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  }

  /**
   * 제품 삭제
   */
  static async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }
}
