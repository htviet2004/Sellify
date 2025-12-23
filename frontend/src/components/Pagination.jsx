export default function Pagination({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange,
  className = ""
}) {
  const pages = []
  const maxVisiblePages = 5
  
  // Calculate visible pages
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  if (totalPages <= 1) return null

  return (
    <div className={`pagination ${className}`}>
      <button 
        className="page-btn" 
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Trước
      </button>
      
      {startPage > 1 && (
        <>
          <button 
            className="page-btn"
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {startPage > 2 && <span className="page-ellipsis">...</span>}
        </>
      )}
      
      {pages.map(page => (
        <button
          key={page}
          className={`page-btn ${page === currentPage ? 'active' : ''}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="page-ellipsis">...</span>}
          <button 
            className="page-btn"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}
      
      <button 
        className="page-btn" 
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Sau
      </button>
    </div>
  )
}
