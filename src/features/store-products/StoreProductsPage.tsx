import { useEffect, useState } from "react";
import type { StoreProduct } from "../../domain/types";
import {
  getStoreProducts,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
} from "./api";
import "./StoreProductsPage.css";

const STORES = ["Coles", "Woolworths", "Aldi", "IGA", "Other"];

const EMPTY_FORM: Omit<StoreProduct, "id" | "createdAt"> = {
  name: "",
  brand: "",
  sizeLabel: "",
  store: "Coles",
  productUrl: "",
  imageUrl: "",
};

export default function StoreProductsPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StoreProduct | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Omit<StoreProduct, "id" | "createdAt">>(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      setProducts(await getStoreProducts());
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelected(null);
    setFormData({ ...EMPTY_FORM });
    setIsEditing(true);
  };

  const handleEdit = (product: StoreProduct) => {
    setSelected(product);
    setFormData({
      name: product.name,
      brand: product.brand ?? "",
      sizeLabel: product.sizeLabel ?? "",
      store: product.store,
      productUrl: product.productUrl,
      imageUrl: product.imageUrl ?? "",
    });
    setIsEditing(true);
  };

  const handleViewDetails = (product: StoreProduct) => {
    setSelected(product);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a product name");
      return;
    }
    if (!formData.productUrl.trim()) {
      alert("Please enter a product URL");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        brand: formData.brand?.trim() || undefined,
        sizeLabel: formData.sizeLabel?.trim() || undefined,
        store: formData.store,
        productUrl: formData.productUrl.trim(),
        imageUrl: formData.imageUrl?.trim() || undefined,
      };

      if (selected) {
        await updateStoreProduct({ ...payload, id: selected.id, createdAt: selected.createdAt });
      } else {
        await createStoreProduct(payload);
      }
      await loadProducts();
      setIsEditing(false);
      setSelected(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelected(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteStoreProduct(id);
      await loadProducts();
      if (selected?.id === id) {
        setSelected(null);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete product. Please try again.");
    }
  };

  const filteredProducts = searchQuery.trim()
    ? products.filter(
        p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.store.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  return (
    <div className="store-products-page">
      <div className="page-header">
        <h1>🛒 Store Products</h1>
        <button className="btn btn-primary" onClick={handleAddNew}>
          + Add Product
        </button>
      </div>

      <div className="sp-layout">
        <div className="sp-sidebar">
          <input
            className="sp-search"
            type="search"
            placeholder="Search by name, brand or store…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {loading ? (
            <p className="empty-message">Loading products…</p>
          ) : filteredProducts.length === 0 ? (
            <p className="empty-message">
              {searchQuery ? "No products match your search." : "No products yet. Add your first one!"}
            </p>
          ) : (
            <ul className="sp-list">
              {filteredProducts.map(product => (
                <li
                  key={product.id}
                  className={`sp-card${selected?.id === product.id ? " selected" : ""}`}
                  onClick={() => handleViewDetails(product)}
                >
                  <div className="sp-card-name">{product.name}</div>
                  {product.brand && (
                    <div className="sp-card-meta">{product.brand}</div>
                  )}
                  <div className="sp-card-store">{product.store}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="sp-detail">
          {isEditing ? (
            <ProductForm
              formData={formData}
              onChange={setFormData}
              onSave={handleSave}
              onCancel={handleCancel}
              saving={saving}
              isNew={!selected}
            />
          ) : selected ? (
            <ProductView
              product={selected}
              onEdit={() => handleEdit(selected)}
              onDelete={() => handleDelete(selected.id)}
            />
          ) : (
            <div className="empty-state">
              <p>Select a product to view details, or add a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Product Form ─────────────────────────────────────────────────────────────

interface ProductFormProps {
  formData: Omit<StoreProduct, "id" | "createdAt">;
  onChange: (data: Omit<StoreProduct, "id" | "createdAt">) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  isNew: boolean;
}

function ProductForm({ formData, onChange, onSave, onCancel, saving, isNew }: ProductFormProps) {
  return (
    <div className="sp-form">
      <h2>{isNew ? "New Product" : "Edit Product"}</h2>

      <div className="form-group">
        <label>Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => onChange({ ...formData, name: e.target.value })}
          placeholder="e.g. Chicken Breast"
        />
      </div>

      <div className="form-group">
        <label>Brand</label>
        <input
          type="text"
          value={formData.brand ?? ""}
          onChange={e => onChange({ ...formData, brand: e.target.value })}
          placeholder="e.g. Lilydale"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Size / Label</label>
          <input
            type="text"
            value={formData.sizeLabel ?? ""}
            onChange={e => onChange({ ...formData, sizeLabel: e.target.value })}
            placeholder="e.g. 500g"
          />
        </div>
        <div className="form-group">
          <label>Store *</label>
          <select
            value={formData.store}
            onChange={e => onChange({ ...formData, store: e.target.value })}
          >
            {STORES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Product URL *</label>
        <input
          type="url"
          value={formData.productUrl}
          onChange={e => onChange({ ...formData, productUrl: e.target.value })}
          placeholder="https://www.coles.com.au/product/…"
        />
      </div>

      <div className="form-group">
        <label>Image URL</label>
        <input
          type="url"
          value={formData.imageUrl ?? ""}
          onChange={e => onChange({ ...formData, imageUrl: e.target.value })}
          placeholder="https://…"
        />
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Product View ─────────────────────────────────────────────────────────────

interface ProductViewProps {
  product: StoreProduct;
  onEdit: () => void;
  onDelete: () => void;
}

function ProductView({ product, onEdit, onDelete }: ProductViewProps) {
  return (
    <div className="sp-view">
      <div className="view-header">
        <h2>{product.name}</h2>
        <div className="view-actions">
          <button className="btn btn-primary" onClick={onEdit}>Edit</button>
          <button className="btn btn-danger" onClick={onDelete}>Delete</button>
        </div>
      </div>

      {product.imageUrl && (
        <div className="sp-image-wrap">
          <img src={product.imageUrl} alt={product.name} className="sp-image" />
        </div>
      )}

      <table className="sp-detail-table">
        <tbody>
          {product.brand && (
            <tr>
              <th>Brand</th>
              <td>{product.brand}</td>
            </tr>
          )}
          {product.sizeLabel && (
            <tr>
              <th>Size</th>
              <td>{product.sizeLabel}</td>
            </tr>
          )}
          <tr>
            <th>Store</th>
            <td>{product.store}</td>
          </tr>
          <tr>
            <th>Product URL</th>
            <td>
              <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="sp-link">
                Open product ↗
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
