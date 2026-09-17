import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ProcurementService, CreateSupplierDto, CreatePODto } from './procurement.service';

@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('suppliers')
  getAllSuppliers() {
    return this.procurementService.getAllSuppliers();
  }

  @Get('inventory')
  getAllInventory(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.procurementService.getAllInventory(
      skip ? parseInt(skip, 10) : undefined,
      take ? parseInt(take, 10) : undefined
    );
  }

  @Post('inventory')
  createInventoryItem(@Body() dto: { name: string; partNumber: string; quantity: number; minQuantity: number; price: number }) {
    return this.procurementService.createInventoryItem(dto);
  }

  @Post('inventory/bulk')
  bulkCreateInventoryItems(@Body() dto: { items: Array<{ name: string; partNumber: string; quantity: number; minQuantity: number; price: number }> }) {
    return this.procurementService.bulkCreateInventoryItems(dto.items);
  }

  @Patch('inventory/:id')
  updateInventoryItem(@Param('id') id: string, @Body() dto: { name?: string; partNumber?: string; quantity?: number; minQuantity?: number; price?: number }) {
    return this.procurementService.updateInventoryItem(id, dto);
  }

  @Delete('inventory/:id')
  deleteInventoryItem(@Param('id') id: string) {
    return this.procurementService.deleteInventoryItem(id);
  }

  @Post('suppliers')
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.procurementService.createSupplier(dto);
  }

  @Get('purchase-orders')
  getAllPurchaseOrders() {
    return this.procurementService.getAllPurchaseOrders();
  }

  @Post('purchase-orders')
  createPurchaseOrder(@Body() dto: CreatePODto) {
    return this.procurementService.createPurchaseOrder(dto);
  }

  @Patch('purchase-orders/:id/receive')
  markPOReceived(@Param('id') id: string) {
    return this.procurementService.markPOReceived(id);
  }

  @Patch('purchase-orders/:id/cancel')
  cancelPurchaseOrder(@Param('id') id: string) {
    return this.procurementService.cancelPurchaseOrder(id);
  }
}
