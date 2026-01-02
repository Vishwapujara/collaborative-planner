import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { teamsAPI, projectsAPI, tasksAPI } from '../services/api';
import type { Team } from '../types';
import { Users, FolderKanban, Plus, CheckSquare } from 'lucide-react';
export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState({
    totalTeams: 0,
    activeProjects: 0,
    totalTasks: 0,
    tasksByStatus: {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch teams
      const teamsResponse = await teamsAPI.getAll();
      const userTeams = teamsResponse.data.teams;
      setTeams(userTeams);

      // Fetch all projects for all teams
      const projectPromises = userTeams.map(team => 
        projectsAPI.getByTeam(team.id).catch(() => ({ data: { projects: [] } }))
      );
      const projectResponses = await Promise.all(projectPromises);
      const allProjects = projectResponses.flatMap(res => res.data.projects);
      
      // Count active projects
      const activeProjects = allProjects.filter(p => p.status === 'active').length;

      // Fetch all tasks for all projects
      const taskPromises = allProjects.map(project =>
        tasksAPI.getByProject(project.id).catch(() => ({ data: { tasks: [] } }))
      );
      const taskResponses = await Promise.all(taskPromises);
      const allTasks = taskResponses.flatMap(res => res.data.tasks);

      // Count tasks by status
      const tasksByStatus = {
        TODO: allTasks.filter(t => t.status === 'TODO').length,
        IN_PROGRESS: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
        DONE: allTasks.filter(t => t.status === 'DONE').length,
      };

      setStats({
        totalTeams: userTeams.length,
        activeProjects,
        totalTasks: allTasks.length,
        tasksByStatus,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your teams today.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading dashboard...</div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Teams</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalTeams}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Projects</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeProjects}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FolderKanban className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <CheckSquare className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Task Status Breakdown */}
            {stats.totalTasks > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.tasksByStatus.TODO}</p>
                    <p className="text-sm text-gray-600 mt-1">To Do</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{stats.tasksByStatus.IN_PROGRESS}</p>
                    <p className="text-sm text-gray-600 mt-1">In Progress</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.tasksByStatus.DONE}</p>
                    <p className="text-sm text-gray-600 mt-1">Done</p>
                  </div>
                </div>
              </div>
            )}

            {/* Teams Section */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Your Teams</h2>
                <Link to="/teams" className="btn btn-primary flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  View All Teams
                </Link>
              </div>

              {teams.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">You haven't joined any teams yet.</p>
                  <Link to="/teams" className="btn btn-primary">
                    Create Your First Team
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.slice(0, 6).map((team) => (
                    <Link
                      key={team.id}
                      to={`/teams/${team.id}/projects`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
                    >
                      <h3 className="font-semibold text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {team._count?.members || 0} members
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};
