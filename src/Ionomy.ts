import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import * as https from 'https';
import moment from 'moment';

export interface Ionomy {
	api: string;
	apiKey: string;
	apiSecret: string;
	keepAlive: boolean;
	client: AxiosInstance;
}

interface orderbook {
	market: string;
	type: string;
}

interface LimitOrder {
	market: string;
	amount: number;
	price: number;
}

interface Withdraw {
	currency: string;
	amount: number;
	address: string;
}

export class Ionomy {
	constructor({ api = "", apiKey = "", apiSecret = "", keepAlive = true } = {}) {
		this.apiKey = apiKey;
		this.apiSecret = apiSecret;

		this.client = axios.create({
		baseURL: (api) || 'https://ionomy.com/api/v1/',
		httpsAgent: new https.Agent({ keepAlive }),
		});
	}

	requestSignature(path: string, params: any, timestamp: number) {
		const query = new URLSearchParams(params).toString();
		const url = `${this.client.defaults.baseURL}${path}${(query) ? `?${query}` : ''}`;
		const hmac = crypto.createHmac('sha512', this.apiSecret);
		return hmac.update(url + timestamp).digest('hex');
	}

	async request(endpoint: string, params: any = {}) {
		let headers = {};
		if (this.apiKey && this.apiSecret) {
		const timestamp: number = moment().unix();
		const hmac = this.requestSignature(endpoint, params, timestamp);
		headers = {
			'api-auth-time': timestamp,
			'api-auth-key': this.apiKey,
			'api-auth-token': hmac,
		};
		}
		const { data } = await this.client.get(endpoint, { params, headers });
		if (!data.success) {
		throw new Error(data.message);
		}
		return data.data;
	}


	markets() {
		return this.request('public/markets');
	}

	currencies() {
		return this.request('public/currencies');
	}

	orderBook({ market, type = 'both' }: orderbook) {
		if (!market) throw new Error('market is required');
		if (!['ask', 'bid', 'both'].includes(type)) throw new Error('type must be one of: asks, bids, both');
		return this.request('public/orderbook', { market, type });
	}

	marketSummaries() {
		return this.request('public/markets-summaries');
	}

	marketSummary(market: string) {
		if (!market) throw new Error('market is required');
		return this.request('public/market-summary', { market });
	}

	marketHistory(market: string) {
		if (!market) throw new Error('market is required');
		return this.request('public/market-history', { market });
	}

	limitBuy({ market, amount, price }: LimitOrder) {
		if (!market) throw new Error('market is required');
		if (!amount) throw new Error('amount is required');
		if (!price) throw new Error('price is required');
		const params = { market, amount, price};
		return this.request('market/buy-limit', params);
	}

	limitSell({ market, amount, price }: LimitOrder) {
		if (!market) throw new Error('market is required');
		if (!amount) throw new Error('amount is required');
		if (!price) throw new Error('price is required');
		const params = { market, amount, price };
		return this.request('market/sell-limit', params);
	}

	cancelOrder(orderId: string) {
		if (!orderId) throw new Error('orderId is required');
		return this.request('market/cancel-order', { orderId });
	}

	openOrders(market: string) {
		if (!market) throw new Error('market is required');
		return this.request('market/open-orders', { market });
	}

	balances() {
		return this.request('account/balances');
	}

	balance(currency: string) {
		if (!currency) throw new Error('currency is required');
		return this.request('account/balance', { currency });
	}

	depositAddress(currency: string) {
		if (!currency) throw new Error('currency is required');
		return this.request('account/deposit-address', { currency });
	}

	depositHistory(currency: string) {
		if (!currency) throw new Error('currency is required');
		return this.request('account/deposit-history', { currency });
	}

	withdraw({ currency, amount, address }: Withdraw) {
		if (!currency) throw new Error('currency is required');
		if (!amount) throw new Error('amount is required');
		if (!address) throw new Error('address is required');
		const params = { currency, amount, address };
		return this.request('account/withdraw', params);
	}

	withdrawalHistory(currency: string) {
		if (!currency) throw new Error('currency is required');
		return this.request('account/withdrawal-history', { currency });
	}

	order(orderId: string) {
		if (!orderId) throw new Error('orderId is required');
		return this.request('account/order', { orderId });
	}

	orderHistory(market: string) {
		if (!market) throw new Error('market is required');
		return this.request('account/order-history', { market });
	}
}