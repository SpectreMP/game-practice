import { createTheme } from '@mui/material/styles';

const theme = createTheme();

const nodeStyles = {
  node: {
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.text.primary,
    fontSize: theme.typography.fontSize,
    textAlign: 'center',
    borderWidth: 1,
    borderStyle: 'solid',
    width: 200,
    boxShadow: theme.shadows[1],
  },
  variableNode: {
    backgroundColor: theme.palette.info.light,
    borderColor: theme.palette.info.main,
  },
  numberNode: {
    backgroundColor: theme.palette.success.light,
    borderColor: theme.palette.success.main,
  },
  printNode: {
    backgroundColor: theme.palette.warning.light,
    borderColor: theme.palette.warning.main,
  },
  loopNode: {
    backgroundColor: theme.palette.error.light,
    borderColor: theme.palette.error.main,
  },
  nodeHeader: {
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
  },
  nodeContent: {
    display: 'flex',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    marginTop: theme.spacing(1),
  },
};

export default nodeStyles;