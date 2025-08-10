export type POST_ORDERS_REQUEST = {
    symbol: string, // any valid ticker symbol
    qty: number,
    notional: number, // qty or notional required, not both
    side: 'buy' | 'sell',
    type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop',
    time_in_force: 'day' | 'gtc' | 'opg' | 'ioc',
    limit_price: number, // optional,
    stop_price: number, // optional,
    client_order_id: string, // optional,
    extended_hours: boolean, // optional,
    order_class: string, // optional,
    take_profit: object, // optional,
    stop_loss: object, // optional,
    trail_price: string, // optional,
    trail_percent: string // optional,
  };