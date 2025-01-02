import { Container, Box, Paper } from '@mui/material';
import LoginForm from '../../components/auth/LoginForm';

function Login() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4 
      }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%',
            backgroundColor: 'background.paper'
          }}
        >
          <LoginForm />
        </Paper>
      </Box>
    </Container>
  );
}

export default Login; 