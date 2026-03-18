from pydantic import BaseModel
from typing import Optional, List

class UserCreate(BaseModel):
    name: str; email: str; password: str; role: str
    phone: Optional[str] = None; address: Optional[str] = None

class UserLogin(BaseModel):
    email: str; password: str

class UserOut(BaseModel):
    id: int; name: str; email: str; role: str
    phone: Optional[str] = None; address: Optional[str] = None

class ProductCreate(BaseModel):
    name: str; description: Optional[str] = None; category: str
    price: float; unit: str = "kg"; stock: int = 100
    image_url: Optional[str] = None
    harvest_date: Optional[str] = None; freshness_days: Optional[int] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None; description: Optional[str] = None
    category: Optional[str] = None; price: Optional[float] = None
    unit: Optional[str] = None; stock: Optional[int] = None
    image_url: Optional[str] = None
    harvest_date: Optional[str] = None; freshness_days: Optional[int] = None

class ProductOut(BaseModel):
    id: int; shop_id: int; name: str; description: Optional[str] = None
    category: str; price: float; unit: str; stock: int
    image_url: Optional[str] = None
    harvest_date: Optional[str] = None; freshness_days: Optional[int] = None

class OrderItem(BaseModel):
    product_id: int; product_name: str; quantity: int; price: float

class OrderCreate(BaseModel):
    shop_id: int; items: List[OrderItem]; total_amount: float
    delivery_type: str; delivery_address: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str

class OrderOut(BaseModel):
    id: int; customer_id: int; shop_id: int; items: list
    total_amount: float; delivery_type: str
    delivery_address: Optional[str] = None; status: str
    carbon_saved: Optional[float] = None; created_at: Optional[str] = None

class KhataEntryCreate(BaseModel):
    customer_id: int; amount: float
    note: Optional[str] = None; type: str

class RecurringOrderCreate(BaseModel):
    shop_id: int; items: List[OrderItem]; frequency: str
    delivery_type: str; delivery_address: Optional[str] = None

class GroupOrderCreate(BaseModel):
    shop_id: int; items: List[OrderItem]
    target_amount: float; my_contribution: float

class GroupOrderJoin(BaseModel):
    code: str; items: List[OrderItem]; contribution: float

class RestockAlertCreate(BaseModel):
    product_id: int

class BundleItem(BaseModel):
    product_id: int; product_name: str; quantity: int; price: float

class BundleCreate(BaseModel):
    name: str; description: Optional[str] = None; items: List[BundleItem]
    original_price: float; bundle_price: float; image_url: Optional[str] = None

class WhatsAppOrderCreate(BaseModel):
    phone: str; message: str; shop_id: Optional[int] = None
