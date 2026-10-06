// Supabase 대시보드의 Project URL과 anon/public key를 이곳에 입력합니다.
// 브라우저 코드에는 service_role 키를 절대 넣지 마세요.
const SUPABASE_URL = 'https://bgfkzcfgrgfewzdtaprt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZmt6Y2ZncmdmZXd6ZHRhcHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMzcxNDUsImV4cCI6MjEwNjgxMzE0NX0.XeKMDFqgqsuvJNG9bDJUFGIDRXJhU0U4zqf9T_TM2xE';
const hasSupabaseConfig =
	!SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
	!SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY');
const supabaseClient = hasSupabaseConfig && window.supabase
	? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
	: null;

// id가 drink인 드롭다운을 가져옵니다. 선택한 음료의 이름과 가격을 읽을 때 사용합니다.
const drinkSelect = document.getElementById('drink');

// 주문서와 화면에 금액, 주문 결과, 탭을 표시할 요소들을 가져옵니다.
const orderForm = document.getElementById('order-form');
const quantityInput = document.getElementById('quantity');
const estimatedPrice = document.getElementById('estimated-price');
const orderConfirmation = document.getElementById('order-confirmation');
const orderTab = document.getElementById('order-tab');
const ordersTab = document.getElementById('orders-tab');
const orderPanel = document.getElementById('order-panel');
const ordersPanel = document.getElementById('orders-panel');
const orderList = document.getElementById('order-list');
const orderCount = document.getElementById('order-count');
const orderSummary = document.getElementById('order-summary');
const ordersTotal = document.getElementById('orders-total');
const clearOrdersButton = document.getElementById('clear-orders');

// 접수된 주문을 저장하는 배열입니다. 새 주문은 배열의 맨 앞에 넣습니다.
const orders = [];
let nextOrderNumber = 1;

// 현재 선택된 음료, 사이즈, 추가 옵션과 수량을 읽어 총 금액을 계산합니다.
// 음료를 고르지 않았다면 주문할 음료가 없으므로 금액을 0으로 돌려줍니다.
function calculateTotal() {
	if (!drinkSelect.value) {
		return 0;
	}

	// 가격은 HTML의 data-price 속성에서 숫자로 읽습니다.
	const drinkPrice = Number(drinkSelect.selectedOptions[0].dataset.price);
	const selectedSize = document.querySelector('input[name="size"]:checked');
	const sizePrice = selectedSize ? Number(selectedSize.dataset.price) : 0;

	// 체크된 옵션들의 가격을 하나씩 더합니다. 체크된 옵션이 없으면 합계는 0입니다.
	const optionsPrice = Array.from(
		document.querySelectorAll('input[name="options"]:checked')
	).reduce((total, option) => total + Number(option.dataset.price), 0);

	// 음료 한 잔의 가격에 사이즈와 옵션 추가금을 더한 뒤 수량을 곱합니다.
	const quantity = Number(quantityInput.value) || 1;
	return (drinkPrice + sizePrice + optionsPrice) * quantity;
}

// 계산 결과를 천 단위 쉼표가 있는 원화 문자열로 화면에 보여줍니다.
function updateEstimatedPrice() {
	estimatedPrice.textContent = `예상 금액: ${calculateTotal().toLocaleString('ko-KR')}원`;
}

// 주문 배열을 읽어 주문 카드, 주문 건수, 총 금액을 화면에 다시 그립니다.
function renderOrders() {
	orderList.replaceChildren();
	orderCount.textContent = String(orders.length);

	if (orders.length === 0) {
		const emptyMessage = document.createElement('p');
		emptyMessage.className = 'empty-orders';
		emptyMessage.textContent = '아직 주문 내역이 없어요 ☕';
		orderList.append(emptyMessage);
		orderSummary.classList.add('hidden');
		return;
	}

	orders.forEach((order) => {
		// 주문 한 건을 카드로 만들고, 손님이 입력한 값은 textContent로 안전하게 표시합니다.
		const card = document.createElement('article');
		card.className = 'order-card';

		const cardHeader = document.createElement('div');
		cardHeader.className = 'order-card-header';

		const title = document.createElement('h3');
		title.textContent = `#${order.number} ${order.name}님 · ${order.amount.toLocaleString('ko-KR')}원`;

		const cancelButton = document.createElement('button');
		cancelButton.type = 'button';
		cancelButton.className = 'order-cancel-button';
		cancelButton.dataset.orderNumber = String(order.number);
		cancelButton.textContent = '취소';
		cardHeader.append(title, cancelButton);

		const details = document.createElement('p');
		const optionsText = order.options.length > 0
			? ` (${order.options.join(', ')})`
			: '';
		details.textContent = `${order.drink} ${order.size}사이즈${optionsText} ${order.quantity}잔`;

		const noteAndTime = document.createElement('p');
		noteAndTime.className = 'order-card-meta';
		noteAndTime.textContent = order.request
			? `요청사항: ${order.request} · 주문 시간: ${order.orderedAt}`
			: `주문 시간: ${order.orderedAt}`;

		card.append(cardHeader, details, noteAndTime);
		orderList.append(card);
	});

	// 목록에 있는 주문 금액을 더해 전체 합계를 표시합니다.
	const totalAmount = orders.reduce((total, order) => total + order.amount, 0);
	ordersTotal.textContent = `총 주문 금액: ${totalAmount.toLocaleString('ko-KR')}원 (${orders.length}건)`;
	orderSummary.classList.remove('hidden');
}

// 두 탭 중 선택된 탭만 표시하고 선택 상태도 함께 갱신합니다.
function showTab(showOrders) {
	orderPanel.classList.toggle('hidden', showOrders);
	ordersPanel.classList.toggle('hidden', !showOrders);
	orderTab.setAttribute('aria-selected', String(!showOrders));
	ordersTab.setAttribute('aria-selected', String(showOrders));
}

// 배지 애니메이션을 다시 시작해 주문이 접수될 때마다 통통 튀게 합니다.
function animateOrderCount() {
	orderCount.classList.remove('badge-pop');
	void orderCount.offsetWidth;
	orderCount.classList.add('badge-pop');
}

orderTab.addEventListener('click', () => showTab(false));
ordersTab.addEventListener('click', () => showTab(true));

// 음료, 사이즈, 옵션이 바뀌면 예상 금액을 다시 계산합니다.
drinkSelect.addEventListener('change', updateEstimatedPrice);
document.querySelectorAll('input[name="size"], input[name="options"]').forEach((input) => {
	input.addEventListener('change', updateEstimatedPrice);
});

// 수량 입력 중에도 금액이 바로 바뀌도록 input 이벤트를 사용합니다.
quantityInput.addEventListener('input', updateEstimatedPrice);

// 주문하기 버튼을 누르면 이름과 음료를 확인하고 주문 내용을 표시합니다.
orderForm.addEventListener('submit', async (event) => {
	// 브라우저가 페이지를 새로고침하는 기본 제출 동작을 막습니다.
	event.preventDefault();

	const customerName = document.getElementById('customer-name').value.trim();
	if (!customerName) {
		alert('이름을 입력해주세요');
		return;
	}

	if (!drinkSelect.value) {
		alert('음료를 선택해주세요');
		return;
	}

	if (!supabaseClient) {
		alert('script.js 맨 위에 Supabase Project URL과 anon key를 입력해주세요.');
		return;
	}

	const selectedSize = document.querySelector('input[name="size"]:checked');
	const size = selectedSize ? selectedSize.value : 'M';
	const selectedOptions = Array.from(
		document.querySelectorAll('input[name="options"]:checked')
	).map((option) => option.value);

	// 추가 옵션이 있을 때만 옵션 이름을 괄호로 감싸서 표시합니다.
	const optionsText = selectedOptions.length > 0
		? ` (${selectedOptions.join(', ')})`
		: '';
	const quantity = Number(quantityInput.value) || 1;
	const amount = calculateTotal();
	const total = amount.toLocaleString('ko-KR');
	const phoneNumber = document.getElementById('phone-number').value.trim();
	const request = document.getElementById('request').value.trim();
	const submitButton = orderForm.querySelector('button[type="submit"]');
	const originalButtonText = submitButton.textContent;

	// 제출 버튼을 잠시 잠가 빠른 연속 클릭으로 중복 주문되는 것을 막습니다.
	submitButton.disabled = true;
	submitButton.textContent = '접수 중...';
	try {
		const { error } = await supabaseClient.from('orders').insert({
			customer_name: customerName,
			phone_number: phoneNumber || null,
			drink: drinkSelect.value,
			size,
			options: selectedOptions,
			quantity,
			request: request || null,
			amount
		});

		if (error) {
			throw error;
		}
	} catch (error) {
		console.error('Supabase 주문 저장 오류:', error);
		alert('주문을 저장하지 못했습니다. Supabase 주소, anon key, 테이블 정책을 확인해주세요.');
		return;
	} finally {
		submitButton.disabled = false;
		submitButton.textContent = originalButtonText;
	}

	const order = {
		number: nextOrderNumber,
		name: customerName,
		drink: drinkSelect.value,
		size,
		options: selectedOptions,
		quantity,
		request,
		amount,
		orderedAt: new Date().toLocaleString('ko-KR')
	};

	orders.unshift(order);
	nextOrderNumber += 1;
	renderOrders();
	animateOrderCount();

	orderConfirmation.textContent = `${customerName}님, ${drinkSelect.value} ${size}사이즈${optionsText} ${quantity}잔, 총 ${total}원 주문이 접수되었습니다!`;
	orderConfirmation.classList.remove('hidden');
});

// 취소 버튼을 누른 주문만 확인을 거쳐 배열에서 제거합니다.
orderList.addEventListener('click', (event) => {
	const cancelButton = event.target.closest('.order-cancel-button');
	if (!cancelButton) {
		return;
	}

	const orderNumber = Number(cancelButton.dataset.orderNumber);
	const order = orders.find((item) => item.number === orderNumber);
	if (!order || !confirm(`#${order.number} ${order.name}님의 주문을 취소할까요?`)) {
		return;
	}

	const orderIndex = orders.findIndex((item) => item.number === orderNumber);
	orders.splice(orderIndex, 1);
	renderOrders();
});

// 전체 삭제도 확인 창을 거친 뒤 주문 내역만 비웁니다.
clearOrdersButton.addEventListener('click', () => {
	if (!confirm('주문 내역을 모두 지울까요?')) {
		return;
	}

	orders.splice(0, orders.length);
	renderOrders();
});

// 다시 작성 버튼은 주문서만 초기화하고 접수된 주문 배열은 그대로 둡니다.
orderForm.addEventListener('reset', () => {
	orderConfirmation.textContent = '';
	orderConfirmation.classList.add('hidden');

	// reset 이벤트가 끝난 다음 초기화된 입력값 기준으로 금액을 계산합니다.
	window.setTimeout(updateEstimatedPrice, 0);
});

// 페이지를 열었을 때도 현재 입력 상태에 맞춰 예상 금액을 표시합니다.
updateEstimatedPrice();
renderOrders();
