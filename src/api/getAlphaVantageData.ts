const getAlphaVantageData = async ({ queryKey }: { queryKey: string[] }) => {
  const [, type, symbol] = queryKey;

  const response = await fetch(
    `https://www.alphavantage.co/query?function=${type}&symbol=${symbol}&apikey=${process.env.REACT_APP_ALPHA_VANTAGE_API_KEY}`
    // `https://www.alphavantage.co/query?function=${type}&symbol=${symbol}&apikey=demo`
  );
  const data = await response.json();
  return data;
};

export default getAlphaVantageData;
