import { Injectable } from '@nestjs/common';

@Injectable()
export class BatchService {
	getHello(): string {
		return 'UNI-FINDER Batch is running!';
	}
}
