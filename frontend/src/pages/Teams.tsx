import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { teamsAPI } from '../services/api';
import type { Team } from '../types';
import { Users, Plus, ChevronRight, UserPlus, Mail } from 'lucide-react';

export const Teams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [addMemberError, setAddMemberError] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await teamsAPI.getAll();
      setTeams(response.data.teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await teamsAPI.create(formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberError('');
    
    if (!selectedTeam) return;

    try {
      await teamsAPI.addMember(selectedTeam.id, memberEmail);
      setShowAddMemberModal(false);
      setMemberEmail('');
      setSelectedTeam(null);
      fetchTeams(); // Refresh to show new member
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to add member';
      setAddMemberError(errorMsg);
    }
  };

  const openAddMemberModal = (team: Team, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTeam(team);
    setShowAddMemberModal(true);
    setAddMemberError('');
  };

  const isAdmin = (team: Team) => {
    return team.members.some(m => m.role === 'admin');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            <p className="mt-2 text-gray-600">Manage your teams and collaborate with others.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-600 mb-4">Create your first team to get started.</p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              Create Your First Team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div key={team.id} className="card hover:shadow-lg transition-shadow group relative">
                <Link to={`/teams/${team.id}/projects`} className="block">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <Users className="h-6 w-6 text-primary-600" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{team.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {team.description || 'No description'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {team._count?.members || 0} members
                    </span>
                    {isAdmin(team) && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Admin
                      </span>
                    )}
                  </div>
                </Link>

                {/* Add Member Button - Only for admins */}
                {isAdmin(team) && (
                  <button
                    onClick={(e) => openAddMemberModal(team, e)}
                    className="absolute top-4 right-12 p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                    title="Add team member"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                )}

                {/* Team Members List */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">Members:</p>
                  <div className="flex flex-wrap gap-2">
                    {team.members.slice(0, 3).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded"
                      >
                        <span>{member.user.name}</span>
                        {member.role === 'admin' && (
                          <span className="text-blue-600">★</span>
                        )}
                      </div>
                    ))}
                    {(team._count?.members || 0) > 3 && (
                      <span className="text-xs text-gray-500">
                        +{(team._count?.members || 0) - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create New Team</h2>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Engineering Team"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Our main development team"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMemberModal && selectedTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserPlus className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Add Team Member</h2>
                  <p className="text-sm text-gray-600">{selectedTeam.name}</p>
                </div>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                {addMemberError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {addMemberError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      className="input pl-10"
                      placeholder="jane@example.com"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    The user must have an account with this email
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800">
                    💡 New members will be added with "Member" role. They can view and contribute to projects but cannot delete or manage the team.
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMemberModal(false);
                      setMemberEmail('');
                      setAddMemberError('');
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex items-center">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};