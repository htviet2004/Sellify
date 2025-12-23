/**
 * Generic CRUD Components for Admin Dashboard
 * Reusable components for list, create, edit, delete operations
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../data/constants';

// ==================== ADMIN TABLE ====================
export const AdminTable = ({ 
  columns, 
  data, 
  onEdit, 
  onDelete, 
  onView,
  loading,
  actions = true 
}) => {
  if (loading) {
    return <div className="admin-loading">Loading...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="admin-no-data">No data found</div>;
  }

  return (
    <table className="admin-table">
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th key={idx}>{col.label}</th>
          ))}
          {actions && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIdx) => (
          <tr key={rowIdx}>
            {columns.map((col, colIdx) => (
              <td key={colIdx}>
                {col.render ? col.render(row) : row[col.field]}
              </td>
            ))}
            {actions && (
              <td className="admin-table-actions">
                {onView && (
                  <button 
                    className="admin-btn-view"
                    onClick={() => onView(row)}
                    title="View"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                )}
                {onEdit && (
                  <button 
                    className="admin-btn-edit"
                    onClick={() => onEdit(row)}
                    title="Edit"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                )}
                {onDelete && (
                  <button 
                    className="admin-btn-delete"
                    onClick={() => onDelete(row)}
                    title="Delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};


// ==================== ADMIN SEARCH BAR ====================
export const AdminSearchBar = ({ onSearch, placeholder = "Search..." }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <form className="admin-search-bar" onSubmit={handleSubmit}>
      <i className="fas fa-search"></i>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
      />
      <button type="submit">Search</button>
    </form>
  );
};


// ==================== ADMIN PAGINATION ====================
export const AdminPagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  const pages = [];
  const maxVisible = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="admin-pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="admin-pagination-btn"
      >
        <i className="fas fa-chevron-left"></i> Previous
      </button>
      
      {startPage > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="admin-pagination-page">
            1
          </button>
          {startPage > 2 && <span className="admin-pagination-ellipsis">...</span>}
        </>
      )}
      
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`admin-pagination-page ${page === currentPage ? 'active' : ''}`}
        >
          {page}
        </button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="admin-pagination-ellipsis">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="admin-pagination-page">
            {totalPages}
          </button>
        </>
      )}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="admin-pagination-btn"
      >
        Next <i className="fas fa-chevron-right"></i>
      </button>
    </div>
  );
};


// ==================== ADMIN MODAL ====================
export const AdminModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'medium' // small, medium, large
}) => {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div 
        className={`admin-modal-content admin-modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3>{title}</h3>
          <button className="admin-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="admin-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};


// ==================== ADMIN FORM ====================
export const AdminForm = ({ 
  fields, 
  values, 
  onChange, 
  onSubmit, 
  onCancel,
  submitLabel = 'Save',
  loading = false 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const renderField = (field) => {
    const { name, type, required, options, placeholder, disabled } = field;
    const value = values[name] || '';

    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={4}
          />
        );
      
      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
          >
            <option value="">-- Select --</option>
            {options && options.map((opt, idx) => (
              <option key={idx} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <input
            type="checkbox"
            id={name}
            name={name}
            checked={value}
            onChange={(e) => onChange({ 
              target: { name, value: e.target.checked } 
            })}
            disabled={disabled}
          />
        );
      
      default:
        return (
          <input
            type={type || 'text'}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {fields.map((field, idx) => (
        <div key={idx} className="admin-form-group">
          <label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="admin-required">*</span>}
          </label>
          {renderField(field)}
          {field.help && <small className="admin-form-help">{field.help}</small>}
        </div>
      ))}
      
      <div className="admin-form-actions">
        <button 
          type="submit" 
          className="admin-btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button 
            type="button" 
            className="admin-btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};


// ==================== ADMIN CONFIRM DIALOG ====================
export const AdminConfirmDialog = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title = 'Confirm', 
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div 
        className="admin-modal-content admin-modal-small"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3>{title}</h3>
        </div>
        <div className="admin-modal-body">
          <p>{message}</p>
        </div>
        <div className="admin-modal-footer">
          <button 
            className={danger ? 'admin-btn-danger' : 'admin-btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button 
            className="admin-btn-secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};


// ==================== ADMIN FILTER BAR ====================
export const AdminFilterBar = ({ filters, onFilterChange, onClear }) => {
  return (
    <div className="admin-filter-bar">
      {filters.map((filter, idx) => (
        <div key={idx} className="admin-filter-item">
          <label>{filter.label}</label>
          {filter.type === 'select' ? (
            <select
              value={filter.value}
              onChange={(e) => onFilterChange(filter.name, e.target.value)}
            >
              <option value="">All</option>
              {filter.options.map((opt, i) => (
                <option key={i} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={filter.type || 'text'}
              value={filter.value}
              onChange={(e) => onFilterChange(filter.name, e.target.value)}
              placeholder={filter.placeholder}
            />
          )}
        </div>
      ))}
      {onClear && (
        <button className="admin-btn-clear" onClick={onClear}>
          <i className="fas fa-times"></i> Clear
        </button>
      )}
    </div>
  );
};


// ==================== ADMIN CRUD MANAGER ====================
export const AdminCRUDManager = ({ 
  title,
  apiEndpoint,
  columns,
  fields,
  searchPlaceholder,
  filters,
  pageSize = 20,
  idField = 'id'
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState({});
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit, view
  const [currentItem, setCurrentItem] = useState({});
  const [formValues, setFormValues] = useState({});
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = {
        page,
        page_size: pageSize,
        search: searchTerm,
        ...filterValues
      };
      
      const response = await axios.get(`${API_BASE}${apiEndpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setData(response.data.results || []);
      setTotalPages(response.data.total_pages || 1);
      setTotalCount(response.data.count || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [searchTerm, filterValues]);

  const handleCreate = () => {
    setModalMode('create');
    setFormValues({});
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setModalMode('edit');
    setCurrentItem(item);
    setFormValues(item);
    setShowModal(true);
  };

  const handleView = (item) => {
    setModalMode('view');
    setCurrentItem(item);
    setFormValues(item);
    setShowModal(true);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const id = itemToDelete[idField];
      await axios.delete(`${API_BASE}${apiEndpoint}${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Deleted successfully');
      setShowDeleteConfirm(false);
      fetchData(currentPage);
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (modalMode === 'create') {
        await axios.post(`${API_BASE}${apiEndpoint}create/`, formValues, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Created successfully');
      } else if (modalMode === 'edit') {
        const id = currentItem[idField];
        await axios.put(`${API_BASE}${apiEndpoint}${id}/`, formValues, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Updated successfully');
      }
      
      setShowModal(false);
      fetchData(currentPage);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save');
    }
  };

  const handleFilterChange = (name, value) => {
    setFilterValues(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterClear = () => {
    setFilterValues({});
    setSearchTerm('');
  };

  return (
    <div className="admin-crud-manager">
      <div className="admin-crud-header">
        <h2>{title}</h2>
        <button className="admin-btn-primary" onClick={handleCreate}>
          <i className="fas fa-plus"></i> Add New
        </button>
      </div>

      <div className="admin-crud-controls">
        <AdminSearchBar 
          onSearch={setSearchTerm} 
          placeholder={searchPlaceholder} 
        />
        
        {filters && filters.length > 0 && (
          <AdminFilterBar 
            filters={filters.map(f => ({ ...f, value: filterValues[f.name] || '' }))}
            onFilterChange={handleFilterChange}
            onClear={handleFilterClear}
          />
        )}
      </div>

      <div className="admin-crud-stats">
        Showing {data.length} of {totalCount} items
      </div>

      <AdminTable
        columns={columns}
        data={data}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        loading={loading}
      />

      {totalPages > 1 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={fetchData}
        />
      )}

      <AdminModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          modalMode === 'create' ? `Create ${title}` :
          modalMode === 'edit' ? `Edit ${title}` :
          `View ${title}`
        }
        size="large"
      >
        {modalMode === 'view' ? (
          <div className="admin-view-details">
            {fields.map((field, idx) => (
              <div key={idx} className="admin-detail-row">
                <strong>{field.label}:</strong>
                <span>{formValues[field.name] || 'N/A'}</span>
              </div>
            ))}
          </div>
        ) : (
          <AdminForm
            fields={fields}
            values={formValues}
            onChange={handleFormChange}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowModal(false)}
            submitLabel={modalMode === 'create' ? 'Create' : 'Update'}
          />
        )}
      </AdminModal>

      <AdminConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Confirm Delete"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        danger={true}
      />
    </div>
  );
};

export default AdminCRUDManager;
