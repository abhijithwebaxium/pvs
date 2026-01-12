import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AssignmentIcon from "@mui/icons-material/Assignment";

const HRDashboard = ({ user }) => {
  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PeopleIcon sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
                <Typography variant="h6">Total Employees</Typography>
              </Box>
              <Typography variant="h4">--</Typography>
              <Typography variant="body2" color="text.secondary">
                Active employees
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <BusinessIcon sx={{ fontSize: 40, color: "success.main", mr: 2 }} />
                <Typography variant="h6">Branches</Typography>
              </Box>
              <Typography variant="h4">--</Typography>
              <Typography variant="body2" color="text.secondary">
                Total branches
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PersonAddIcon sx={{ fontSize: 40, color: "info.main", mr: 2 }} />
                <Typography variant="h6">New Hires</Typography>
              </Box>
              <Typography variant="h4">--</Typography>
              <Typography variant="body2" color="text.secondary">
                This month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <AssignmentIcon sx={{ fontSize: 40, color: "warning.main", mr: 2 }} />
                <Typography variant="h6">Pending Tasks</Typography>
              </Box>
              <Typography variant="h4">--</Typography>
              <Typography variant="body2" color="text.secondary">
                Requires attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                HR Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                As an HR manager, you can:
              </Typography>
              <Box component="ul" sx={{ mt: 2 }}>
                <li>Manage employee records and information</li>
                <li>Create and manage branches</li>
                <li>Process employee onboarding</li>
                <li>Review and approve bonuses</li>
                <li>Generate HR reports</li>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HRDashboard;
