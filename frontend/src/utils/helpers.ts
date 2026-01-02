import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date: string) => {
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatDateTime = (date: string) => {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
};

export const formatRelative = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'TODO':
      return 'bg-blue-100 text-blue-800';
    case 'IN_PROGRESS':
      return 'bg-purple-100 text-purple-800';
    case 'DONE':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};