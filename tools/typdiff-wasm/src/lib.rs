use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn typdiff_source(old_source: &str, new_source: &str) -> String {
    let old_blocks: Vec<_> = typdiff::parse::parse(old_source)
        .into_iter()
        .filter(|block| !matches!(block, typdiff::Block::Parbreak))
        .collect();
    let new_blocks: Vec<_> = typdiff::parse::parse(new_source)
        .into_iter()
        .filter(|block| !matches!(block, typdiff::Block::Parbreak))
        .collect();
    typdiff::render::render(&typdiff::diff::diff(&old_blocks, &new_blocks))
}
