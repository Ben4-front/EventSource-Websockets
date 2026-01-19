export default class ChatAPI {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  async registerUser(user) {
    try {
      const response = await fetch(`${this.apiUrl}/new-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      const data = await response.json();

      if (data.status === 'error') {
        return { success: false, error: data.message };
      }

      return { success: true, user: data.user };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Server error' };
    }
  }
}