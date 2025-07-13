import api from './api';

export const visitService = {
  getAllVisits: async () => {
    try {
      const response = await api.get('/admin/visit-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching visit requests:', error);
      throw error;
    }
  },

  updateVisitStatus: async (visitId, status) => {
    try {
      const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      
      console.log(`Updating visit ${visitId} status to:`, normalizedStatus);
      
      const response = await api.put(
        `/admin/visit-requests/${visitId}/status`,
        { status: normalizedStatus },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('Status update response:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Error updating visit status:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      }
      throw error;
    }
  },
  
  updateVisitsStatus: async (visitIds, status) => {
    try {
      const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      
      console.log(`Updating ${visitIds.length} visits status to:`, normalizedStatus);
      
      const results = [];
      for (const id of visitIds) {
        try {
          const result = await api.put(
            `/admin/visit-requests/${id}/status`,
            { status: normalizedStatus },
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            }
          );
          results.push({ id, success: true, data: result.data });
        } catch (error) {
          console.error(`Error updating visit ${id}:`, error);
          results.push({ 
            id, 
            success: false, 
            error: error.response?.data || error.message 
          });
        }
      }
      
      return {
        success: results.every(r => r.success),
        results
      };
      
    } catch (error) {
      console.error('Error in bulk status update:', error);
      throw error;
    }
  },

  getUserVisits: async () => {
    try {
      const response = await api.get('/visit-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching user visits:', error);
      throw error;
    }
  },

  requestVisit: async (petId, visitData) => {
    try {
      const response = await api.post(`/visit-requests/${petId}`, visitData);
      return response.data;
    } catch (error) {
      console.error('Error requesting visit:', error);
      throw error;
    }
  }
};

export default visitService;
