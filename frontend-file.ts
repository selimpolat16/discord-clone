// Axios kullanıyorsanız
axios.defaults.withCredentials = true;

// Fetch kullanıyorsanız
fetch(url, {
  credentials: 'include',
  // diğer ayarlar...
}); 