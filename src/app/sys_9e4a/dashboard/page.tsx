"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";

type Participant = {
  _id: string;
  name: string;
  phone: string;
  giftLabel: string;
  prizeId: string;
  redeemCode: string;
  redeemStatus: string;
  createdAt: string;
  phoneVerified: boolean;
  hasSpun: boolean;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [updating, setUpdating] = useState<string | null>(null);

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        sortField,
        sortOrder,
      });

      const res = await fetch(`/api/sys_9e4a/participants?${query.toString()}`);

      if (res.status === 401) {
        router.push("/");
        return;
      }

      const json = await res.json();
      setData(json.data);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, limit, search, sortField, sortOrder]);

  const [rejectionModal, setRejectionModal] = useState<{ id: string; isOpen: boolean }>({ id: "", isOpen: false });
  const [rejectionReason, setRejectionReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const [confirmationModal, setConfirmationModal] = useState<{ id: string; isOpen: boolean }>({ id: "", isOpen: false });
  // const [resetDbModal, setResetDbModal] = useState(false);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'rejected') {
      setRejectionModal({ id, isOpen: true });
      setRejectionReason("ID Mismatch"); // Default
      setCustomReason("");
      return;
    }
    if (newStatus === 'claimed') {
      setConfirmationModal({ id, isOpen: true });
      return;
    }
    updateStatus(id, newStatus);
  };

  const updateStatus = async (id: string, newStatus: string, reason?: string) => {
    setUpdating(id);
    try {
      const payload: any = { participantId: id, status: newStatus };
      if (reason) payload.rejectionReason = reason;

      const res = await fetch("/api/sys_9e4a/redeem", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Refresh local data
        setData(prev => prev.map(p => p._id === id ? { ...p, redeemStatus: newStatus } : p));
      } else {
        alert("Failed to update");
      }
    } catch (e) {
      alert("Error updating");
    } finally {
      setUpdating(null);
      setRejectionModal({ id: "", isOpen: false });
    }
  };

  const confirmRejection = () => {
    const finalReason = rejectionReason === "Other" ? customReason : rejectionReason;
    if (!finalReason) {
      alert("Please specify a reason");
      return;
    }
    updateStatus(rejectionModal.id, "rejected", finalReason);
  };

  const confirmClaim = () => {
    updateStatus(confirmationModal.id, "claimed");
    setConfirmationModal({ id: "", isOpen: false });
  };

  const handleLogout = async () => {
    await fetch("/api/sys_9e4a/logout", { method: "POST" });
    localStorage.removeItem("admin_key");
    router.push("/");
  }

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-gray-50 p-8 text-black relative pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-end items-center mb-8 gap-4">
            <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition shadow-md">
              Logout
            </button>
          </div>

          {/* =======================
              PRIZE INVENTORY GRID
             ======================= */}
          <InventorySection />

          {/*Search & Controls */}
          <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <input
              type="text"
              placeholder="Search name, phone, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-96 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <div className="flex gap-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg outline-none"
              >
                <option value="createdAt">Date</option>
                <option value="name">Name</option>
                <option value="phone">Phone</option>
                <option value="giftLabel">Gift</option>
                <option value="redeemStatus">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-bold"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="px-4 py-2 border border-gray-200 rounded-lg outline-none"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                  <tr>
                    <th className="p-4 border-b">Sl. No</th>
                    <th className="p-4 border-b">Date</th>
                    <th className="p-4 border-b">Name</th>
                    <th className="p-4 border-b">Phone</th>
                    <th className="p-4 border-b">Gift</th>
                    <th className="p-4 border-b">Redeem Code</th>
                    <th className="p-4 border-b">Status</th>
                    <th className="p-4 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading...</td></tr>
                  ) : data.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-500">No participants found</td></tr>
                  ) : (
                    data.map((row, index) => (
                      <tr key={row._id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 text-gray-500">{(page - 1) * limit + index + 1}</td>
                        <td className="p-4 text-sm text-gray-500">{new Date(row.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 font-medium text-gray-800">
                          {row.name}
                          {(row.phoneVerified || row.hasSpun || row.giftLabel !== '-' || row.redeemStatus !== '-') ? (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          ) : (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Unverified
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-gray-600">{row.phone}</td>
                        <td className="p-4 text-gray-800 font-medium">
                          {row.giftLabel}
                        </td>
                        <td className="p-4 font-mono text-blue-600 font-bold">{row.redeemCode}</td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold capitalize 
                              ${row.redeemStatus === 'claimed' ? 'bg-green-100 text-green-700' :
                              row.redeemStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                row.redeemStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-600'}`}>
                            {row.redeemStatus}
                          </span>
                        </td>
                        <td className="p-4">
                          {['claimed', 'rejected'].includes(row.redeemStatus) ? (
                            <span className="text-gray-400 text-xs italic flex items-center gap-1">
                              <span className="text-lg">🔒</span> Locked
                            </span>
                          ) : (
                            <select
                              value={row.redeemStatus}
                              onChange={(e) => handleUpdateStatus(row._id, e.target.value)}
                              disabled={updating === row._id}
                              className="px-2 py-1 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="claimed">Claimed</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t flex justify-between items-center bg-gray-50">
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Rejection Modal */}
        {rejectionModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Reject Prize Claim</h3>

              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 mb-3 outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="ID Mismatch">ID Mismatch</option>
                <option value="Already Claimed">Already Claimed</option>
                <option value="Suspicious Activity">Suspicious Activity</option>
                <option value="Did not visit store">Did not visit store</option>
                <option value="Other">Other...</option>
              </select>

              {rejectionReason === "Other" && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Type specific reason..."
                  className="w-full border border-gray-300 rounded p-2 mb-4 h-24 outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              )}

              <div className="flex gap-3 justify-end mt-4">
                <button
                  onClick={() => setRejectionModal({ id: "", isOpen: false })}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRejection}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Confirmation Modal */}
        {confirmationModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Confirm Prize Claim</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Are you sure you want to mark this prize as <span className="font-bold text-green-600">CLAIMED</span>?
                <br /><br />
                <span className="text-red-500 font-bold">⚠️ This cannot be undone.</span>
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmationModal({ id: "", isOpen: false })}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClaim}
                  className="px-4 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition"
                >
                  Confirm Claim
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Sub-component for clean code
function InventorySection() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/sys_9e4a/contest')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Failed to load stats", err));
  }, []);

  if (!stats) return <div className="text-center p-12 text-gray-500">Loading Inventory...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-yellow-400 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🎁 Live Prize Inventory</h2>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-bold text-sm shadow-sm border border-purple-200">
            Total Spins: {stats.totalSpins || 0}
          </div>
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-bold text-sm shadow-sm border border-blue-200">
            Total Users: {stats.totalParticipants || 0}
          </div>
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-bold text-sm shadow-sm border border-green-200">
            Verified Users: {stats.totalVerified || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {stats.prizes?.map((prize: any) => {
          // Calculate Init Qty = Remaining (quantity) + Won (count)
          const initQty = (prize.quantity || 0) + (prize.count || 0);
          return (
            <div key={prize.id} className="border border-gray-100 rounded-lg p-4 flex flex-col items-center text-center hover:shadow-md transition bg-gray-50/50">
              <div className="w-16 h-16 mb-2 rounded-full overflow-hidden border-2 border-white shadow-sm">
                {/* Using static images path based on ID or if provided in API */}
                {/* API returns prize.image which should be valid */}
                <img src={prize.image || '/placeholder.png'} alt={prize.label} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{prize.label}</h3>

              <div className="w-full grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="bg-blue-50 p-2 rounded">
                  <span className="block text-gray-500 font-semibold mb-1">Set Qty</span>
                  <span className="text-lg font-bold text-blue-600">{initQty}</span>
                </div>
                <div className={`p-2 rounded ${prize.quantity === 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <span className="block text-gray-500 font-semibold mb-1">Existing</span>
                  <span className={`text-lg font-bold ${prize.quantity === 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {prize.quantity}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
