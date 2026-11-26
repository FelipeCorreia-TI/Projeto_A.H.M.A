import pytest
from playwright.sync_api import sync_playwright, expect

@pytest.fixture(scope="session")
def browser_context():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=300)
        context = browser.new_context()
        yield context
        browser.close()

@pytest.fixture
def cadastro_page(browser_context):
    page = browser_context.new_page()
    page.goto("http://127.0.0.1:5500/Client/index.html")
    
    # Clica na aba de cadastro para exibir o formulário de registo
    page.click("#tab-cadastro")
    return page

def test_elementos_iniciais_cadastro(cadastro_page):
    """Valida se todos os elementos essenciais do formulário de cadastro estão visíveis."""
    reg_form = cadastro_page.locator("#register-form")
    expect(reg_form).to_be_visible()
    
    expect(cadastro_page.locator("#reg-email")).to_be_visible()
    expect(cadastro_page.locator("#reg-password")).to_be_visible()
    expect(cadastro_page.locator("#toggle-reg-password")).to_be_visible()
    expect(cadastro_page.locator("#btn-register")).to_be_visible()
    
    assert cadastro_page.locator("#btn-register").inner_text() == "Criar Conta"

def test_toggle_visibilidade_senha_cadastro(cadastro_page):
    """Valida se o botão de mostrar/ocultar senha funciona corretamente no cadastro."""
    password_input = cadastro_page.locator("#reg-password")
    toggle_btn = cadastro_page.locator("#toggle-reg-password")
    
    # O tipo inicial deve ser 'password'
    assert password_input.get_attribute("type") == "password"
    
    # Clica para mostrar a senha
    toggle_btn.click()
    assert password_input.get_attribute("type") == "text"
    
    # Clica novamente para ocultar
    toggle_btn.click()
    assert password_input.get_attribute("type") == "password"

def test_cadastro_senha_curta_ou_invalida(cadastro_page):
    """Valida o comportamento ao tentar registar com uma senha abaixo do limite mínimo."""
    cadastro_page.fill("#reg-email", "novo.utilizador@ahma.app")
    cadastro_page.fill("#reg-password", "123") # Menor que o minlength=6 definido no input
    
    cadastro_page.click("#btn-register")
    
    # Valida que o formulário continua visível (bloqueado pelo HTML5 / validação)
    expect(cadastro_page.locator("#register-form")).to_be_visible()