const test =  {
  ink: {
    fonSize: 10,
    ':hover': {
      fontWeight: 'bold',
      '@phone': {
        fontWeight: 'bolder'
      }
    },
    '@phone': {
      ':hover': {
        color: 'black'
      },
      fontSize: 12,
    }
  },
  button: {
    fontSize: 12,
    ' ink': {
      width: '100%',
      '>ass': {
        color: 'red',
        ':hover': {
          color: 'blue',
        },
        '@phone': {
          color: 'gray',
          ':hover': {
            color: 'green'
          },
          width: '50%',
        }
      },
      '@phone': {
        width: '50%'
      }
    },
    '>ink': {
      width: '100%',
    },
    '+ink': {
      width: '100%',
      '@phone': {
        width: '50%'
      }
    },
    '~ink': {
      width: '100%',
      '@phone': {
        width: '50%'
      }
    }
  },
  // ass: {
  //   width: '100%',
  // },
  rear: {
    width: '100%'
  }
}

const test2 =  {
  oz: {
    fonSize: 10,
    ':hover': {
      fontWeight: 'bold',
      '@phone': {
        fontWeight: 'bolder'
      }
    },
    '@phone': {
      ':hover': {
        color: 'black'
      },
      fontSize: 12,
    }
  },
}

export default {test, test2};