import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Shield, UserX, UserCheck, Search, Users as UsersIcon, Lock, ShieldCheck, DollarSign, Edit2, X } from 'lucide-react';
import { getUsers, createUser, toggleUserStatus, getRoles, updateUser, payStaff } from '../api/services';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ username: '', password: '', roleId: '', salary: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [paymentUser, setPaymentUser] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([getUsers(), getRoles()]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Échec du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
        toast.success('Utilisateur mis à jour avec succès');
      } else {
        await createUser(formData);
        toast.success('Utilisateur créé avec succès');
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ username: '', password: '', roleId: '', salary: 0 });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Échec de l\'opération');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await payStaff({
        userId: paymentUser.id,
        amount: parseFloat(paymentAmount),
        description: paymentDescription || `Paiement salaire - ${paymentUser.username}`
      });
      toast.success('Paiement effectué avec succès');
      setPaymentUser(null);
      setPaymentAmount('');
      setPaymentDescription('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Échec du paiement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleUserStatus(id);
      toast.success('Statut mis à jour');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Échec de la mise à jour');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.Role?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Gestion des Utilisateurs</h1>
          <p className="text-gray-500">Gérez les comptes de votre personnel et leurs permissions.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm font-semibold"
        >
          <UserPlus className="h-5 w-5" />
          Nouvel Utilisateur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Personnel</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Salaire</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${user.Role?.name === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        user.Role?.name === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                        <Shield className="h-3 w-3" />
                        {user.Role?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">{parseFloat(user.salary).toLocaleString()} FBu</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {user.isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                        {user.isActive ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setFormData({ username: user.username, roleId: user.RoleId, salary: user.salary });
                          setShowModal(true);
                        }}
                        className="p-1 hover:bg-indigo-50 text-indigo-600 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPaymentUser(user)}
                        className="p-1 hover:bg-green-50 text-green-600 rounded transition-colors"
                        title="Payer"
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`text-sm font-semibold transition-colors ${user.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                          }`}
                      >
                        {user.isActive ? 'Suspendre' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Résumé des Permissions
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-xs font-bold text-purple-700 uppercase mb-1">ADMIN</p>
                <p className="text-xs text-purple-600">Accès total au système, gestion des utilisateurs, rapports financiers et inventaire.</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-blue-700 uppercase mb-1">MANAGER</p>
                <p className="text-xs text-blue-600">Peut gérer les stocks, les achats et voir les rapports, mais ne peut pas gérer le personnel.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs font-bold text-gray-700 uppercase mb-1">WAITER</p>
                <p className="text-xs text-gray-600">Peut uniquement effectuer des ventes et consulter l'état des produits.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">{editingUser ? 'Modifier l\'Utilisateur' : 'Nouvel Utilisateur'}</h2>
              <button
                onClick={() => { setShowModal(false); setEditingUser(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom d'utilisateur</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    required={!editingUser}
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder={editingUser ? 'Laisser vide pour ne pas changer' : ''}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Salaire Mensuel (FBu)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    required
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Rôle</label>
                <select
                  required
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                >
                  <option value="">Sélectionnez un rôle</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingUser(null); }}
                  className="flex-1 px-4 py-2 border rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Traitement...' : (editingUser ? 'Enregistrer' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Payer le Personnel</h2>
              <button onClick={() => setPaymentUser(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handlePayStaff} className="p-6 space-y-4">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg">
                  {paymentUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-indigo-900">{paymentUser.username}</p>
                  <p className="text-sm text-indigo-600">Salaire : {parseFloat(paymentUser.salary).toLocaleString()} FBu</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Montant à Payer (FBu)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    required
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500"
                    placeholder={paymentUser.salary}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description / Notes</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  rows="2"
                  placeholder="Ex: Salaire Janvier 2026"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setPaymentUser(null)}
                  className="flex-1 px-4 py-2 border rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !paymentAmount}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <DollarSign className="h-5 w-5" />
                  {submitting ? 'Paiement...' : 'Confirmer le Paiement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

