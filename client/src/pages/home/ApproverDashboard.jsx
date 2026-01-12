import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleIcon from "@mui/icons-material/People";

const ApproverDashboard = ({ user }) => {
  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PendingActionsIcon sx={{ fontSize: 40, color: "warning.main", mr: 2 }} />
                <Typography variant="h6">Pending Approvals</Typography>
              </Box>
              <Typography variant="h4">--</Typography>
              <Typography variant="body2" color="text.secondary">
                Awaiting your review
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 40, color: "success.main", mr: 2 }} />
                <Typography variant="h6">Approved</Typography>
              </Box>
              <Typography variant="h4">--</Typography>
              <Typography variant="body2" color="text.secondary">
                Total approved this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <AttachMoneyIcon sx={{ fontSize: 40, color: "info.main", mr: 2 }} />
                <Typography variant="h6">Bonus Approvals</Typography>
              </Box>
              <Typography variant="h4">--</Typography>
              <Typography variant="body2" color="text.secondary">
                Pending bonus reviews
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PeopleIcon sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
                <Typography variant="h6">Team Members</Typography>
              </Box>
              <Typography variant="h4">--</Typography>
              <Typography variant="body2" color="text.secondary">
                Under your supervision
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Approver Information
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Approval Level: {user?.approverLevel || "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                As an approver, you can:
              </Typography>
              <Box component="ul" sx={{ mt: 2 }}>
                <li>Review and process employee approvals</li>
                <li>Approve or reject bonus allocations</li>
                <li>View approval history and status</li>
                <li>Manage team member information</li>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApproverDashboard;
