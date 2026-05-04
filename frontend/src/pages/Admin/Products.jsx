import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { toast } from 'react-toastify';
import {
  Trash2, CheckCircle, PlusCircle, Edit2,
  X, FolderOpen, Upload
} from 'lucide-react';
import { FALLBACK_IMAGE, getImageUrl } from '../../utils/imageUrl';

const BASE_URL = import.meta.env.VITE_API_URL;

const Products = () => {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData]       = useState({ name: '', price: '', category: '', quantity: '', unit: 'piece' });
  const [isEditing, setIsEditing]     = useState(false);
  const [editId, setEditId]           = useState(null);
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // image source: 'folder' | 'upload' | 'default' | null
  const [imageSource, setImageSource] = useState(null);
  const [autoImagePath, setAutoImagePath] = useState(null);

  const debounceRef = useRef(null);
  const userInfo    = JSON.parse(localStorage.getItem('userInfo'));
  const config      = { headers: { Authorization: `Bearer ${userInfo.token}` } };

  /* ── load table data ── */
  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/products`, config),
        axios.get(`${BASE_URL}/api/categories`, config),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch {
      toast.error('Failed to load data');
    }
  };
  useEffect(() => { fetchData(); }, []);

  /* ── name typing → check local folder via API ── */
  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, name: val }));

    // reset image state
    setImageSource(null);
    setAutoImagePath(null);
    setImagePreview(null);
    setImageFile(null);
    const fi = document.getElementById('imageInput');
    if (fi) fi.value = '';

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) return;

    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(
          `${BASE_URL}/api/products/check-image?name=${encodeURIComponent(val)}`,
          config
        );

        if (data.found) {
          // ✅ Local folder image found
          setAutoImagePath(data.imagePath);
          setImagePreview(getImageUrl(data.imagePath, BASE_URL));
          setImageSource('folder');
        } else {
          // ❌ Not found in folder — need upload
          setImageSource('upload');
          // Show default image as preview placeholder
          setImagePreview(getImageUrl(data.imagePath, BASE_URL));
        }
      } catch (err) {
        console.error(err);
        setImageSource('upload');
      }
    }, 400);
  };

  /* ── file chosen ── */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageSource('upload');
  };

  /* ── edit row ── */
  const handleEdit = (prod) => {
    setIsEditing(true);
    setEditId(prod._id);
    setFormData({
      name: prod.name,
      price: prod.price,
      category: prod.category?._id || '',
      quantity: prod.quantity,
      unit: prod.unit || 'piece'
    });
    if (prod.image) {
      setImagePreview(getImageUrl(prod.image, BASE_URL));
      setImageSource('upload'); // Prevents folder detection UI flash if it's already uploaded
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── reset ── */
  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ name: '', price: '', category: '', quantity: '', unit: 'piece' });
    setImageFile(null);
    setImagePreview(null);
    setAutoImagePath(null);
    setImageSource(null);
    const fi = document.getElementById('imageInput');
    if (fi) fi.value = '';
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // If folder image not found AND no file uploaded → confirm default usage
    if (!isEditing && imageSource === 'upload' && !imageFile) {
      if (!window.confirm('No image uploaded. A default image will be used. Continue?')) return;
    }

    const data = new FormData();
    data.append('name',     formData.name);
    data.append('price',    formData.price);
    data.append('category', formData.category);
    data.append('quantity', formData.quantity);
    data.append('unit',     formData.unit);
    if (imageFile) data.append('image', imageFile);

    try {
      if (isEditing) {
        await axios.put(`${BASE_URL}/api/products/${editId}`, data, config);
        toast.success('Product updated!');
      } else {
        await axios.post(`${BASE_URL}/api/products`, data, config);
        toast.success('Product added to inventory!');
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving product');
    }
  };

  /* ── delete ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/products/${id}`, config);
      toast.success('Product deleted');
      fetchData();
    } catch {
      toast.error('Error deleting product');
    }
  };

  /* ── stock badge ── */
  const stockBadge = (qty) => {
    if (qty === 0) return <span className="text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded-full">Out of Stock</span>;
    if (qty <= 5)  return <span className="text-xs font-semibold text-white bg-orange-400 px-2 py-0.5 rounded-full">{qty} — Low</span>;
    return               <span className="text-xs font-semibold text-white bg-green-500 px-2 py-0.5 rounded-full">{qty} in stock</span>;
  };

  /* ── image section render ── */
  const renderImageSection = () => {
    if (imageSource === 'folder') {
      return (
        <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <img src={imagePreview} alt="auto" className="h-28 w-28 object-cover rounded-lg border shadow-sm" />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
              <FolderOpen size={16} />
              Image auto-assigned from local folder
            </div>
            <p className="text-xs text-gray-500 break-all">{autoImagePath}</p>
            <p className="text-xs text-gray-400 mt-1">No upload needed. To override, choose a file below.</p>
            <input
              id="imageInput"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-2 text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200"
            />
          </div>
        </div>
      );
    }

    if (imageSource === 'upload') {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-blue-700 text-sm font-medium bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg">
            <Upload size={15} />
            No local image found — please upload one manually, or leave empty to use the default image.
          </div>
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
            <input
              id="imageInput"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {imageFile && imagePreview && (
              <div className="mt-3 flex items-center gap-3">
                <img src={imagePreview} alt="preview" className="h-24 w-24 object-cover rounded-lg border shadow-sm" />
                <div>
                  <p className="text-xs text-gray-500">Your upload preview</p>
                  <p className="text-xs font-medium text-gray-700 mt-1">{imageFile.name}</p>
                </div>
              </div>
            )}
            {!imageFile && imagePreview && (
              <div className="mt-3 flex items-center gap-3">
                <img src={imagePreview} alt="default" className="h-16 w-16 object-cover rounded-lg border opacity-50" />
                <p className="text-xs text-gray-400 italic">Default image will be used if nothing is uploaded</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Initial state — name not typed yet
    return (
      <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-400 text-center">
        <Edit2 size={20} className="mx-auto mb-1 text-gray-300" />
        Type a product name above — the system will automatically detect if an image already exists in the local folder.
      </div>
    );
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Products &amp; Inventory</h1>

      {/* ── ADD / EDIT FORM ── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
        <h2 className="text-xl font-semibold mb-5 text-gray-700 flex items-center gap-2">
          {isEditing ? <Edit2 size={22} className="text-blue-500" /> : <PlusCircle size={22} className="text-blue-500" />}
          {isEditing ? 'Edit Product' : 'Add Product'}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Name */}
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm font-medium text-gray-600 mb-1">Product Name</label>
            <input
              type="text"
              placeholder='e.g. "Biriyani" — system checks local /uploads folder automatically'
              value={formData.name}
              onChange={handleNameChange}
              className="border px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            />
          </div>

          {/* Price */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Price (₹ per unit)</label>
            <input
              type="number"
              placeholder="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="border px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
              min="0"
            />
          </div>

          {/* Quantity */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">
              {formData.unit === 'kg' ? 'Stock Quantity (kg)' : 'Stock Quantity (pieces)'}
            </label>
            <input
              type="number"
              placeholder={formData.unit === 'kg' ? '0.5' : '0'}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="border px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
              min="0"
              step={formData.unit === 'kg' ? '0.01' : '1'}
            />
          </div>

          {/* Unit */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Sold By (Unit)</label>
            <div className="flex gap-3">
              {['piece', 'kg'].map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setFormData({ ...formData, unit: u })}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition ${
                    formData.unit === u
                      ? u === 'kg'
                        ? 'bg-purple-600 text-white border-purple-600 shadow'
                        : 'bg-blue-600 text-white border-blue-600 shadow'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {u === 'piece' ? '📦 Piece / Plate' : '⚖️ Weight (kg)'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {formData.unit === 'kg'
                ? 'Staff can enter decimal quantities like 0.5, 1.25 kg'
                : 'Staff will add items 1 piece at a time'}
            </p>
          </div>

          {/* Category */}
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm font-medium text-gray-600 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="border px-4 py-2.5 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Dynamic image section */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600 mb-2 block flex items-center gap-2">
              Product Image
              {imageSource === 'folder' && (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={11} /> Auto-detected
                </span>
              )}
              {imageSource === 'upload' && (
                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Upload Required</span>
              )}
            </label>
            {renderImageSection()}
          </div>

          {/* Buttons */}
          <div className="md:col-span-2 flex gap-3 mt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2.5 rounded-xl transition shadow"
            >
              {isEditing ? 'Update Inventory' : 'Add to Inventory'}
            </button>
            {(formData.name || isEditing) && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium px-5 py-2.5 rounded-xl transition"
              >
                <X size={16} /> {isEditing ? 'Cancel Edit' : 'Clear'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── HOW IT WORKS info ── */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-800 flex items-start gap-3">
        <FolderOpen size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
        <span>
          <strong>Auto-Image Tip:</strong> Place image files in <code className="bg-amber-100 px-1 rounded">backend/uploads/</code> named after the product
          (e.g. <code className="bg-amber-100 px-1 rounded">biriyani.jpg</code>, <code className="bg-amber-100 px-1 rounded">chicken-biriyani.jpg</code>).
          The system will automatically detect and assign them — no upload needed.
        </span>
      </div>

      {/* ── PRODUCT TABLE ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">All Products ({products.length})</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Image', 'Name', 'Price', 'Unit', 'Category', 'Stock', 'Actions'].map(h => (
                <th
                  key={h}
                  className={`px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((prod) => (
              <tr key={prod._id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <img
                    src={getImageUrl(prod.image, BASE_URL)}
                    alt={prod.name}
                    className="h-12 w-12 object-cover rounded-lg border shadow-sm"
                    onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{prod.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">₹{prod.price}<span className="text-xs text-gray-400">/{prod.unit || 'piece'}</span></td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    prod.unit === 'kg' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {prod.unit === 'kg' ? '⚖️ kg' : '📦 piece'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{prod.category?.name || '—'}</td>
                <td className="px-6 py-4">{stockBadge(prod.quantity)}</td>
                <td className="px-6 py-4 flex justify-end gap-2">
                  <button
                    onClick={() => handleEdit(prod)}
                    className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(prod._id)}
                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                  No products yet. Add your first item above!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default Products;
