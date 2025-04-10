export default function SuccessMessage({ message }) {
    return (
      message && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out">
          {message}
        </div>
      )
    );
  }